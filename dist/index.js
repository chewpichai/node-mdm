"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMDM = getMDM;
const android_1 = require("./android");
const apple_1 = require("./apple");
async function getMDM(query) {
    const clz = query.brand === "apple" ? apple_1.AppleMDM : android_1.AndroidMDM;
    return await clz.getInstance(query);
}
