"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const sign_1 = require("./sign");
const BASE_URL = "https://ilockcardf-isp.apps.coloros.com";
const CARRIER_CODE = process.env.OPPO_CARRIER_CODE;
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
    console.log("🚀 ~ sendCommand ~ data:", data);
    return data;
}
async function uploadDevice(imei, productCode) {
    const { timestamp, signature } = (0, sign_1.possefySign)(JSON.stringify({ imei }));
    const response = await fetch("https://openapi.possefy.co.th/api/v1/sleasing/device-validate-imei", {
        method: "POST",
        body: JSON.stringify({ imei }),
        headers: {
            "Content-Type": "application/json",
            "App-Timestamp": timestamp,
            "App-Signature": signature,
        },
    });
    const data = await response.json();
    console.log("🚀 ~ uploadDevice ~ data:", data);
    if (data.success)
        return 200;
    if (data.code === "NOT_FOUND")
        return 461;
    return 400;
}
async function getDevice(imei) {
    const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
    console.log("🚀 ~ getDevice ~ data:", data);
    if (data.message !== "SUCCESS")
        return;
    const device = data.data.list[0];
    return {
        id: imei,
        status: getDeviceStatus(device.status.toLowerCase()),
        modelName: device.marketingName,
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
