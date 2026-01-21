"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDM = exports.AndroidSeekDreamMDM = exports.AndroidMDM = exports.DEVICE_STATUS = void 0;
exports.getMDM = getMDM;
const android_1 = require("./android");
Object.defineProperty(exports, "AndroidMDM", { enumerable: true, get: function () { return android_1.AndroidMDM; } });
const android_seekdream_1 = require("./android-seekdream");
Object.defineProperty(exports, "AndroidSeekDreamMDM", { enumerable: true, get: function () { return android_seekdream_1.AndroidSeekDreamMDM; } });
const apple_1 = require("./apple");
Object.defineProperty(exports, "AppleMDM", { enumerable: true, get: function () { return apple_1.AppleMDM; } });
const CLASSES = {
    apple: apple_1.AppleMDM,
    android: android_1.AndroidMDM,
    "android-seekdream": android_seekdream_1.AndroidSeekDreamMDM,
};
async function getMDM(query) {
    const clz = CLASSES[query.brand];
    return await clz.getInstance(query);
}
var types_1 = require("./types");
Object.defineProperty(exports, "DEVICE_STATUS", { enumerable: true, get: function () { return types_1.DEVICE_STATUS; } });
