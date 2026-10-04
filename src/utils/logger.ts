type LogArguments = readonly unknown[];

const writeLog = (level: string, method: "info" | "warn" | "error", args: LogArguments): void => {
	console[method](`[${new Date().toISOString()}] ${level}:`, ...args);
};

export const logger = {
	info: (...args: LogArguments): void => writeLog("INFO", "info", args),
	warn: (...args: LogArguments): void => writeLog("WARN", "warn", args),
	error: (...args: LogArguments): void => writeLog("ERROR", "error", args),
};
