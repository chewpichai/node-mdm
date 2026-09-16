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
    return data;
}
async function uploadDevice(imei, productCode) {
    let data = await sendCommand("/flexiblePackage/upload", {
        deviceUid: imei,
        productName: productCode,
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
    isSuccess = data.result === "SUCCESS";
    if (isSuccess)
        return 200;
    return data.error.code;
}
async function getDevice(imei) {
    const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
    console.log("🚀 ~ getDevice ~ data:", data);
    if (data.message !== "SUCCESS" || data.data.list.length === 0)
        return;
    const device = data.data.list[0];
    return {
        id: imei,
        status: getDeviceStatus(device.status.toLowerCase()),
        modelName: device.marketingName || device.model,
        createTime: (0, dayjs_1.default)(device.statusActivatedDate).format("YYYYMMDDHHmmss"),
        lastOnlineTime: (0, dayjs_1.default)(device.lastSyncTime).format("YYYYMMDDHHmmss"),
    };
}
function getDeviceStatus(status) {
    switch (status) {
        case "normal":
            return "active";
        default:
            return status;
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
    getDevice,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
