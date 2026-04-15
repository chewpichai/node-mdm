"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDMLockPhoneMDM = exports.AppleMDM = exports.AppleChewLabxMDM = exports.AndroidSeekDreamMDM = exports.AndroidMDM = exports.DEVICE_STATUS = void 0;
exports.getMDM = getMDM;
const android_1 = require("./android");
Object.defineProperty(exports, "AndroidMDM", { enumerable: true, get: function () { return android_1.AndroidMDM; } });
const android_seekdream_1 = require("./android-seekdream");
Object.defineProperty(exports, "AndroidSeekDreamMDM", { enumerable: true, get: function () { return android_seekdream_1.AndroidSeekDreamMDM; } });
const apple_1 = require("./apple");
Object.defineProperty(exports, "AppleMDM", { enumerable: true, get: function () { return apple_1.AppleMDM; } });
const apple_chewlabx_1 = require("./apple-chewlabx");
Object.defineProperty(exports, "AppleChewLabxMDM", { enumerable: true, get: function () { return apple_chewlabx_1.AppleChewLabxMDM; } });
const apple_mdmlockphone_1 = require("./apple-mdmlockphone");
Object.defineProperty(exports, "AppleMDMLockPhoneMDM", { enumerable: true, get: function () { return apple_mdmlockphone_1.AppleMDMLockPhoneMDM; } });
async function getMDM(query) {
    switch (query.brand) {
        case "apple-chewlabx":
            return await apple_chewlabx_1.AppleChewLabxMDM.getInstance(query);
        case "android":
            return await android_1.AndroidMDM.getInstance(query);
        case "android-seekdream":
            return await android_seekdream_1.AndroidSeekDreamMDM.getInstance(query);
        case "apple":
            return await apple_1.AppleMDM.getInstance(query);
        case "apple-mdmlockphone":
            return await apple_mdmlockphone_1.AppleMDMLockPhoneMDM.getInstance(query);
        default:
            throw new Error("Invalid brand");
    }
}
var types_1 = require("./types");
Object.defineProperty(exports, "DEVICE_STATUS", { enumerable: true, get: function () { return types_1.DEVICE_STATUS; } });
