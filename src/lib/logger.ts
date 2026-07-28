import dayjs from "dayjs";

export function log(...args: unknown[]) {
  console.log(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}

export function warn(...args: unknown[]) {
  console.warn(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}

export function error(...args: unknown[]) {
  console.error(`[${dayjs().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}

export const logger = {
  log,
  warn,
  error,
};

export default logger;
