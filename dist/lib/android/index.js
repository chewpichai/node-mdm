"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xiaomi = exports.techno = exports.realme = exports.infinix = void 0;
const infinix_1 = __importDefault(require("./infinix"));
Object.defineProperty(exports, "infinix", { enumerable: true, get: function () { return infinix_1.default; } });
Object.defineProperty(exports, "techno", { enumerable: true, get: function () { return infinix_1.default; } });
const realme_1 = __importDefault(require("./realme"));
exports.realme = realme_1.default;
const xiaomi_1 = __importDefault(require("./xiaomi"));
exports.xiaomi = xiaomi_1.default;
