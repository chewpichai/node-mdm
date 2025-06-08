"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDM = exports.AndroidMDM = exports.DEVICE_STATUS = void 0;
exports.getMDM = getMDM;
const android_1 = require("./android");
Object.defineProperty(exports, "AndroidMDM", { enumerable: true, get: function () { return android_1.AndroidMDM; } });
const apple_1 = require("./apple");
Object.defineProperty(exports, "AppleMDM", { enumerable: true, get: function () { return apple_1.AppleMDM; } });
async function getMDM(query) {
    const clz = query.brand === "apple" ? apple_1.AppleMDM : android_1.AndroidMDM;
    return await clz.getInstance(query);
}
var types_1 = require("./types");
Object.defineProperty(exports, "DEVICE_STATUS", { enumerable: true, get: function () { return types_1.DEVICE_STATUS; } });
