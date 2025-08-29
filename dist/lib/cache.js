"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
const node_cache_1 = __importDefault(require("node-cache"));
let cache = null;
function getCache() {
    if (cache)
        return cache;
    cache = new node_cache_1.default();
    return cache;
}
