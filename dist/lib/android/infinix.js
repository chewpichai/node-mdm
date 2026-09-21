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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
const dayjs_1 = __importDefault(require("dayjs"));
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
    return data;
}
async function uploadDevice(imei) {
    const expiration = (0, dayjs_1.default)().add(2, "year").unix();
    let data = await sendCommand("/api/partner/lock/v1/imei/input", {
        imeiInfo: JSON.stringify([{ imei, expiration }]),
        apiKey: API_KEY,
        preLockFlag: false,
    });
    console.log("🚀 ~ uploadDevice ~ data:", data);
    const isSuccess = data.code === 200;
    if (isSuccess)
        return 200;
    if (data.code === 50021)
        return 461;
    return data.code;
}
async function getDevice(imei) {
    const data = await sendCommand("/api/partner/model/v1/get", {
        imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ getDevice ~ data:", data);
    if (data.message.toLowerCase() !== "success")
        return;
    const device = data.data;
    const [status, lockStatus] = await Promise.all([
        getDeviceStatus(imei),
        getDeviceLockStatus(imei),
    ]);
    return {
        id: imei,
        status: status === "active" ? lockStatus : status,
        modelName: `${device.modelMarketName} (${device.ram}+${device.rom}GB)`,
        createTime: "",
        lastOnlineTime: "",
    };
}
async function getDeviceStatus(imei) {
    const data = await sendCommand("/api/partner/lock/v1/findLockState", {
        imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ getDeviceStatus ~ data:", data);
    switch (data.data.serverState) {
        case 500:
            return "activating";
        case 1000:
            return "activating";
        case 2000:
            return "activating";
        case 3000:
            return "active";
        default:
            return "unknown";
    }
}
async function getDeviceLockStatus(imei) {
    const data = await sendCommand("/api/partner/anti-theft/v1/status", {
        imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ getDeviceLockStatus ~ data:", data);
    if (data.code === 200 && data.data.operationStatus === "ON")
        return "locked";
    return "active";
}
async function lockDevice(imei, phone, message) {
    const data = await sendCommand("/api/partner/anti-theft/v1/submit", {
        imei,
        contactInformation: `tel: ${phone} ${message}`,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ lockDevice ~ data:", data);
    return data.code === 200;
}
async function unlockDevice(imei) {
    const data = await sendCommand("/api/partner/anti-theft/v1/close", {
        deviceUid: imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ unlockDevice ~ data:", data);
    return data.code === 200;
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
    return data.code === 200;
}
async function completeDevice(imei) {
    const data = await sendCommand("/api/partner/lock/v1/removeLock", {
        imeiInfo: imei,
        apiKey: API_KEY,
    });
    console.log("🚀 ~ completeDevice ~ data:", data);
    return data.code === 200;
}
exports.default = {
    uploadDevice,
    getDevice,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
