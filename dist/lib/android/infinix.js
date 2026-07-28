"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const BASE_URL = "https://paytrigger.transsion-os.com/PayTrigger";
const API_KEY = process.env.INFINIX_API_KEY;
function getSign(body) {
    const keys = Object.keys(body).sort();
    const signContent = keys.map((key) => `${key}=${body[key]}`).join("&");
    const hexHmac = crypto
        .createHmac("sha256", API_KEY)
        .update(signContent)
        .digest("hex")
        .toUpperCase();
    return Buffer.from(hexHmac, "utf-8").toString("base64");
}
async function sendCommand(url, body) {
    const response = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            sign: getSign(body),
        },
    });
    const data = await response.json();
    console.log("🚀 ~ sendCommand ~ data:", data);
    return data;
}
async function getDeviceStatus(imei) {
    const data = await sendCommand("/api/partner/lock/v1/findLockState", {
        imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ getDeviceStatus ~ data:", data);
    return data;
}
async function lockDevice(imei, phone, message) {
    const data = await sendCommand("/api/partner/anti-theft/v1/submit", {
        imei,
        contactInformation: `tel: ${phone} ${message}`,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ lockDevice ~ data:", data);
    return data;
}
async function unlockDevice(imei) {
    const data = await sendCommand("/api/partner/anti-theft/v1/close", {
        deviceUid: imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ unlockDevice ~ data:", data);
    return data;
}
async function sendMessage(imei, phone, message) {
    const data = await sendCommand("/api/partner/push/v1/sendPushInfo", {
        imei,
        apiKey: API_KEY,
        content: message,
        title: phone,
        pushType: 1,
    });
    console.log("🚀 ~ sendMessage ~ data:", data);
    return data;
}
async function completeDevice(imei) {
    const data = await sendCommand("/api/partner/lock/v1/removeLock", {
        imeiInfo: imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ completeDevice ~ data:", data);
    return data;
}
exports.default = {
    getDeviceStatus,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
