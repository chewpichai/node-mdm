"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.formatLine = formatLine;
exports.log = log;
exports.warn = warn;
exports.error = error;
const util_1 = __importDefault(require("util"));
const dayjs_1 = __importDefault(require("dayjs"));
function formatLine(...args) {
    const timestamp = `[${(0, dayjs_1.default)().format("YYYY-MM-DD HH:mm:ss")}]`;
    if (args.length === 0) {
        return timestamp;
    }
    const message = util_1.default
        .formatWithOptions({ breakLength: Infinity, compact: true, depth: null }, ...args)
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
    return `${timestamp} ${message}`;
}
function log(...args) {
    console.log(formatLine(...args));
}
function warn(...args) {
    console.warn(formatLine(...args));
}
function error(...args) {
    console.error(formatLine(...args));
}
exports.logger = {
    log,
    warn,
    error,
    formatLine,
};
exports.default = exports.logger;
