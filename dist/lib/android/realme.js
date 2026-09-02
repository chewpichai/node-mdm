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
const apple_1 = require("../../apple");
const BASE_URL = "https://ilockcardf-isp.realme.com";
const CARRIER_CODE = process.env.REALME_CARRIER_CODE;
const TOKEN = process.env.REALME_TOKEN;
function getSign(body) {
    const dataToSign = `${body},${CARRIER_CODE},${TOKEN}`;
    return crypto
        .createHash("sha256")
        .update(dataToSign, "utf8")
        .digest("base64");
}
async function sendCommand(url, body) {
    const response = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "x-carrier-code": CARRIER_CODE,
            "x-transactionId": Date.now().toString(),
            "x-sign": getSign(JSON.stringify(body)),
        },
    });
    const data = await response.json();
    console.log("🚀 ~ sendCommand ~ data:", data);
    return data;
}
async function uploadDevice(imei) {
    let data = await sendCommand("/flexiblePackage/upload", {
        deviceUid: imei,
        productName: "",
        operationType: 1,
    });
    console.log("🚀 ~ uploadDevice ~ data:", data);
    let isSuccess = data.message === "SUCCESS";
    if (!isSuccess)
        return 400;
    await (0, apple_1.sleep)(5000);
    data = await sendCommand("/package/bindPackage", {
        deviceUid: imei,
        type: 1,
    });
    console.log("🚀 ~ bindPackage ~ data:", data);
    isSuccess = data.message === "SUCCESS";
    if (isSuccess)
        return 200;
    return data.error.code;
}
async function getDeviceStatus(imei) {
    const data = await sendCommand("/getStatus", { deviceUid: imei });
    console.log("🚀 ~ getDeviceStatus ~ data:", data);
    switch (data.status) {
        case 0:
            return "active";
        case 1:
            return "locked";
        case 2:
            return "locking";
        case 3:
            return "completed";
        case 4:
            return "completing";
        case 5:
            return "unlocking";
        case 7:
            return "activating";
        default:
            return "unknown";
    }
}
async function lockDevice(imei, phone, message) {
    const data = await sendCommand("/lock", {
        deviceUid: imei,
        tel: phone,
        message,
    });
    console.log("🚀 ~ lockDevice ~ data:", data);
    return data.result === "SUCCESS";
}
async function unlockDevice(imei) {
    const data = await sendCommand("/unlock", { deviceUid: imei });
    console.log("🚀 ~ unlockDevice ~ data:", data);
    return data.result === "SUCCESS";
}
async function sendMessage(imei, phone, message) {
    const data = await sendCommand("/sendMessage", {
        deviceUid: imei,
        tel: phone,
        message,
    });
    console.log("🚀 ~ sendMessage ~ data:", data);
    return data.result === "SUCCESS";
}
async function completeDevice(imei) {
    const data = await sendCommand("/complete", { deviceUid: imei });
    console.log("🚀 ~ completeDevice ~ data:", data);
    return data.result === "SUCCESS";
}
exports.default = {
    uploadDevice,
    getDeviceStatus,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
