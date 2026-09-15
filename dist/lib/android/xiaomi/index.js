"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const apple_1 = require("../../../apple");
const cache_1 = require("../../cache");
const BASE_URL = "https://api.cloud.trustonic.com/api/v2";
const API_KEY = process.env.XIAOMI_API_KEY;
const TENANT_ID = process.env.XIAOMI_TENANT_ID;
const CACHE_KEY = "xiaomiToken";
const cache = (0, cache_1.getCache)();
async function getToken() {
    const response = await fetch(`${BASE_URL}/authorization/token`, {
        method: "POST",
        headers: { apiKey: API_KEY },
    });
    const { token } = await response.json();
    return token;
}
async function sendCommand(url, body, method = "POST") {
    let token = cache.get(CACHE_KEY);
    if (!token) {
        token = await getToken();
        cache.set(CACHE_KEY, token, 60 * 60);
    }
    const response = await fetch(`${BASE_URL}${url}`, {
        method,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            tenantId: TENANT_ID,
        },
    });
    const data = await response.json();
    console.log("🚀 ~ sendCommand ~ data:", data);
    return data;
}
async function uploadDevice(imei) {
    let data = await sendCommand("/inventory/upload", {
        deviceList: [
            {
                deviceUid: imei,
                idType: "imei",
                deviceType: "smartphone",
                serviceList: [{ serviceName: "deviceFinancing" }],
            },
        ],
    });
    console.log("🚀 ~ uploadDevice ~ data:", data);
    let isSuccess = data.deviceList[0].resultCode === "SUCCESS";
    if (!isSuccess)
        return 461;
    await (0, apple_1.sleep)(5000);
    data = await sendCommand("/service/activate", {
        deviceList: [
            {
                deviceUid: imei,
                serviceList: [{ serviceName: "deviceFinancing" }],
            },
        ],
    });
    isSuccess = data.serviceList[0].resultCode === "SUCCESS";
    if (isSuccess)
        return 201;
    return 200;
}
async function getDevice(imei) {
    const data = await sendCommand("/query/devices", {
        deviceList: [{ deviceUid: imei }],
    });
    console.log("🚀 ~ getDevice ~ data:", data);
    const device = data.deviceResponseList[0];
    if (device.resultCode)
        return;
    return {
        id: imei,
        status: getDeviceStatus(device.stateInfo.toLowerCase()),
        modelName: device.deviceMarketName,
        createTime: (0, dayjs_1.default)(device.createdTimeStamp).format("YYYYMMDDHHmmss"),
        lastOnlineTime: (0, dayjs_1.default)(device.lastCheckIn).format("YYYYMMDDHHmmss"),
    };
}
function getDeviceStatus(status) {
    switch (status) {
        case "ready for use":
            return "activating";
        case "released":
            return "completed";
        default:
            return status;
    }
}
async function lockDevice(imei, phone, message) {
    const data = await sendCommand("/device/lock/", {
        lockList: [
            {
                deviceUid: imei,
                lockType: "lock",
                lockMsgTitle: phone,
                lockMsgContent: message,
            },
        ],
    });
    console.log("🚀 ~ lockDevice ~ data:", data);
    return data.lockResponseList[0].resultCode === "SUCCESS";
}
async function unlockDevice(imei) {
    const data = await sendCommand("/device/unlock/", {
        unLockList: [{ deviceUid: imei }],
    });
    console.log("🚀 ~ unlockDevice ~ data:", data);
    return data.unlockResponseList[0].resultCode === "SUCCESS";
}
async function sendMessage(imei, phone, message) {
    const data = await sendCommand("/device/notify/", {
        messageList: [
            {
                deviceUid: imei,
                notificationType: "fullscreen",
                notificationTitle: phone,
                notificationContent: message,
            },
        ],
    });
    console.log("🚀 ~ sendMessage ~ data:", data);
    return data.messageResponseList[0].resultCode === "SUCCESS";
}
async function completeDevice(imei) {
    const data = await sendCommand("/device/release/", { deviceReleaseList: [{ deviceUid: imei }] }, "PUT");
    console.log("🚀 ~ completeDevice ~ data:", data);
    return data.releaseResponseList[0].resultCode === "SUCCESS";
}
exports.default = {
    uploadDevice,
    getDevice,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
