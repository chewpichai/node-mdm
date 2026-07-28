"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.log = log;
exports.warn = warn;
exports.error = error;
const dayjs_1 = __importDefault(require("dayjs"));
function log(...args) {
    console.log(`[${(0, dayjs_1.default)().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}
function warn(...args) {
    console.warn(`[${(0, dayjs_1.default)().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}
function error(...args) {
    console.error(`[${(0, dayjs_1.default)().format("YYYY-MM-DD HH:mm:ss")}]`, ...args);
}
exports.logger = {
    log,
    warn,
    error,
};
exports.default = exports.logger;
