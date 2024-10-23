const fs = require("fs");
const { v4: uuid } = require("uuid");
const nodeCron = require("node-cron");
const { program } = require("commander");
const { exec } = require("child_process");
const log4js = require("log4js");

log4js.addLayout("json", (config) => (event) => {
	const temp = {};
	temp.pid = event.pid;
	temp.timestamp = event.startTime;
	temp.level = event.level.levelStr;
	temp.data = event.data.join(" ");
	return JSON.stringify(temp) + config.separator;
});

log4js.configure({
	appenders: { cron: { type: "file", filename: "cron.log", layout: { type: "json", separator: "," }, maxLogSize: 1048576, backups: 3 } },
	categories: { default: { appenders: ["cron"], level: "info" } },
});

program.option("-c, --config <path>", "path to config file");
program.parse(process.argv);

const options = program.opts();
const logger = log4js.getLogger("cron");
if (!options.config) {
	throw new Error("Config file is required");
}
const content = fs.readFileSync(options.config, "utf8");
if (!content) {
	throw new Error("Config file is empty");
}
const config = JSON.parse(content);
const cronMap = {};

config.tasks.forEach((task) => {
	logger.info(`Scheduling task ${task.name}`);
	task.id = uuid();
	cronMap[task.id] = nodeCron.schedule(task.cron, () => {
		logger.info(`Running task ${task.command}`);
		const cp = exec(task.command);
		cp.stdout.on("data", (data) => {
			logger.info(data);
		});
		cp.stderr.on("data", (data) => {
			logger.error(data);
		});
		cp.on("close", (code) => {
			logger.info(`child process exited with code ${code}`);
		});
	});
});


process.on("SIGINT", () => {
	Object.values(cronMap).forEach((cron) => {
		cron.stop();
	});
	process.exit(0);
});
