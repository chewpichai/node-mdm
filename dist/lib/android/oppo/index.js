"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const apple_1 = require("../../../apple");
const sign_1 = require("./sign");
const BASE_URL = "https://ilockcardf-isp.apps.coloros.com";
const CARRIER_CODE = process.env.OPPO_CARRIER_CODE;
async function validateDevice(imei) {
    const { timestamp, signature } = (0, sign_1.possefySign)(JSON.stringify({ imei }));
    return fetch("https://openapi.possefy.co.th/api/v1/sleasing/device-validate-imei", {
        method: "POST",
        body: JSON.stringify({ imei }),
        headers: {
            "Content-Type": "application/json",
            "App-Timestamp": timestamp,
            "App-Signature": signature,
        },
    });
}
async function sendCommand(url, body) {
    const response = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "x-carrier-code": CARRIER_CODE,
            "x-transactionId": Date.now().toString(),
            "x-sign": (0, sign_1.oGuardSign)(JSON.stringify(body)),
        },
    });
    const data = await response.json();
    return data;
}
async function uploadDevice(imei) {
    const response = await validateDevice(imei);
    if (response.status !== 200)
        return response.status;
    let data = await response.json();
    console.log("🚀 ~ uploadDevice ~ data:", data);
    let isSuccess = data.success;
    if (!isSuccess)
        return data.code === "NOT_FOUND" ? 461 : 400;
    await (0, apple_1.sleep)(5000);
    data = await sendCommand("/setmeal/choose", {
        deviceUid: imei,
        type: 1,
    });
    console.log("🚀 ~ bindPackage ~ data:", data);
    isSuccess = data.result === "SUCCESS";
    if (isSuccess)
        return 200;
    return data.error?.code || 400;
}
async function getDevice(imei) {
    let modelName = null;
    const response = await validateDevice(imei);
    if (response.status === 200)
        modelName = (await response.json()).data?.model_name;
    const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
    console.log("🚀 ~ getDevice ~ data:", data);
    if (data.message !== "SUCCESS" || data.data.list.length === 0)
        return;
    const device = data.data.list[0];
    return {
        id: imei,
        status: getDeviceStatus(device.status.toLowerCase()),
        modelName: modelName || device.model,
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
        title: phone,
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
        title: phone,
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
