import { spawn } from "child_process";
import readline from "readline";
import chalk from "chalk";
import { loadAliases } from "./core/config.js";
import fs from "fs";
import path from "path";

// START

let currentDir = process.cwd();
let commandCount = 1;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: chalk.cyanBright(`[${commandCount}] >> `),
});

const aliases = loadAliases();

const isWindows = process.platform === "win32";
const fallbackLs = isWindows ? "dir" : "ls";

// reading lines
// HELPERS

const rlPrompt = () => {
	rl.setPrompt(chalk.cyan(`${currentDir} [${commandCount}] >> `));
	rl.prompt();
};

// END HELPERS

rlPrompt();

rl.on("line", async (line) => {
	const input = line.trim();
	if (input == "exit") process.exit(0);

	// handle "cd" manually
	if (input.startsWith("cd ")) {
		const targetDir = input.slice(3).trim() || process.env.HOME;
		const newPath = path.resolve(currentDir, targetDir);
		if (fs.existsSync(newPath) && fs.lstatSync(newPath).isDirectory()) {
			currentDir = newPath;
			process.chdir(currentDir);
		} else {
			console.log(chalk.red("Directory not found."));
		}
		return rlPrompt();
	}
	if (input.startsWith("cd..")) {
		const targetDir = input.slice(2).trim() || process.env.HOME;
		const newPath = path.resolve(currentDir, targetDir);
		if (fs.existsSync(newPath) && fs.lstatSync(newPath).isDirectory()) {
			currentDir = newPath;
			process.chdir(currentDir);
		} else {
			console.log(chalk.red("Directory not found."));
		}
		return rlPrompt();
	}

	// plugin supporet
	if (plugins[input]) {
		await plugins[input]();
		commandCount++;
		// rlPrompt();
		// return;
		return rlPrompt();
	}

	const expanded = aliases[input] || input;
	const parts = expanded.split(" ");
	const cmd = parts[0];
	const args = parts.slice(1);

	// Validate command and arguments before spawning
	if (!cmd) {
		console.log(chalk.red("No command provided."));
		rl.prompt();
		return;
	}

	if (!Array.isArray(args)) {
		console.log(chalk.red("Arguments must be an array."));
		rl.prompt();
		return;
	}

	// fallback for 'ls' command
	if (cmd === "ls" && !fs.existsSync(cmd)) {
		const child = spawn(fallbackLs, args, {
			cwd: currentDir,
			stdio: "inherit",
			shell: true,
			text: true,
			capture_output: true,
		});
		child.on("exit", () => {
			commandCount++;
			rlPrompt();
		});
		return;
	}

	const child = spawn(cmd, args, {
		stdio: "inherit",
		shell: true,
		text: true,
		capture_output: true,
	});

	child.on("exit", () => {
		commandCount++;
		rlPrompt();
	});
});

// PLUGINS

const plugins = {};
const pluginsDir = path.resolve("./plugins");
const pluginFiles = fs.readdirSync(pluginsDir);
for (const file of pluginFiles) {
	const pluginModule = await import(`./plugins/${file}`);
	const plugin = pluginModule.default || pluginModule;
	plugins[plugin.name] = plugin.run;
}

// END
