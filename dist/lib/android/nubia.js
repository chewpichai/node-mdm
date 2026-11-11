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
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const logger_1 = require("../logger");
const types_1 = require("../../types");
dayjs_1.default.extend(utc_1.default);
const BASE_URL = "https://vdmsvn.ztems.com/vdms20/api/north";
const KEY_ID = process.env.NUBIA_KEY_ID;
const KEY_SECRET = process.env.NUBIA_KEY_SECRET;
function getSign(body, timestamp) {
    const raw = `accessKeyId=${KEY_ID}&timestamp=${timestamp}&body=${body}&${KEY_SECRET}`;
    return crypto.createHash("md5").update(raw, "utf8").digest("hex");
}
async function sendCommand(path, body) {
    const url = `${BASE_URL}${path}`;
    const timestamp = Date.now();
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "x-access-key-id": KEY_ID,
            "x-api-timestamp": timestamp.toString(),
            "x-api-signature": getSign(JSON.stringify(body), timestamp),
        },
    });
    const data = await response.json();
    return data;
}
async function uploadDevice(imei) {
    let data = await sendCommand("/enroll", [{ imei }]);
    logger_1.logger.log(`🚀 ~ ${imei} ~ uploadDevice ~ data:`, data);
    return data.message === "success" ? 200 : data.code;
}
async function getDevice(imei) {
    const data = await sendCommand("/get-model", [{ imei }]);
    logger_1.logger.log(`🚀 ~ ${imei} ~ getDevice ~ data:`, data);
    if (data.message !== "success" || data.data.length === 0)
        return;
    const device = data.data[0];
    return {
        id: 0,
        deviceStatus: getDeviceStatus(device.status),
        phoneModel: device.modelName,
        description: "",
        serialNumber: imei,
        imei,
        activationLockStatus: 0,
        functionRestrictData: null,
        httpProxyStatus: 0,
        commandContentList: [],
        deviceAssignedBy: "",
        color: "",
        usbItunesStatus: 0,
        deviceCapacity: "",
        osVersion: "",
        createTime: (0, dayjs_1.default)(device.createTime).format("YYYYMMDDHHmmss"),
        lastOnlineTime: (0, dayjs_1.default)(device.modifyTime).format("YYYYMMDDHHmmss"),
    };
}
function getDeviceStatus(status) {
    switch (status) {
        case 0:
            return types_1.DeviceStatus.activating;
        case 1:
            return types_1.DeviceStatus.active;
        case 2:
            return types_1.DeviceStatus.locked;
        case 3:
            return types_1.DeviceStatus.completed;
        case 11:
            return types_1.DeviceStatus.lock;
        case 12:
            return types_1.DeviceStatus.unlocking;
        case 13:
            return types_1.DeviceStatus.completed;
        default:
            return types_1.DeviceStatus.unknown;
    }
}
async function lockDevice(imei, phone, message) {
    const data = await sendCommand("/lock", {
        imei,
        lockInfoList: [{ type: "LOCK_PHONE" }],
    });
    logger_1.logger.log(`🚀 ~ ${imei} ~ lockDevice ~ data:`, data);
    return data.message === "success";
}
async function unlockDevice(imei) {
    const data = await sendCommand("/unlock", {
        imei,
        lockInfoList: [{ type: "LOCK_PHONE" }],
    });
    logger_1.logger.log(`🚀 ~ ${imei} ~ unlockDevice ~ data:`, data);
    return data.message === "success";
}
async function sendMessage(imei, phone, message) {
    const data = await sendCommand("/alert", {
        imei,
        alertMessage: message,
    });
    logger_1.logger.log(`🚀 ~ ${imei} ~ sendMessage ~ data:`, data);
    return data.message === "success";
}
async function completeDevice(imei) {
    const data = await sendCommand("/deregister", [{ imei }]);
    logger_1.logger.log(`🚀 ~ ${imei} ~ completeDevice ~ data:`, data);
    return data.message === "success";
}
exports.default = {
    uploadDevice,
    getDevice,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
