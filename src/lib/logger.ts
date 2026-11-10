import util from "util";
import dayjs from "dayjs";

export function formatLine(...args: unknown[]): string {
  const timestamp = `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`;
  if (args.length === 0) {
    return timestamp;
  }

  const message = util
    .formatWithOptions(
      { breakLength: Infinity, compact: true, depth: null },
      ...args
    )
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");

  return `${timestamp} ${message}`;
}

export function log(...args: unknown[]) {
  console.log(formatLine(...args));
}

export function warn(...args: unknown[]) {
  console.warn(formatLine(...args));
}

export function error(...args: unknown[]) {
  console.error(formatLine(...args));
}

export const logger = {
  log,
  warn,
  error,
  formatLine,
};

export default logger;

