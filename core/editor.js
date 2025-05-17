const { exec } = require("child_process");

const openEditor = (file = ".") => {
	const editor = process.env.EDITOR || "code";
	exec(`${editor} ${file}`);
};

module.exports = { openEditor };
