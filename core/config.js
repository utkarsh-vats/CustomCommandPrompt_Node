import fs from "fs";
import path from "path";

const loadAliases = () => {
	const configPath = path.resolve(
		path.dirname(new URL(import.meta.url).pathname),
		"../config/settings.json"
	);
	if (!fs.existsSync(configPath)) return {};
	const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
	return data.aliases || {};
};

export { loadAliases };
