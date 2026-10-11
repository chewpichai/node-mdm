import * as crypto from "crypto";
import dayjs from "dayjs";
import { DeviceStatus, MDMDevice } from "../../types";

const BASE_URL = "https://paytrigger.transsion-os.com/PayTrigger";
const API_KEY = process.env.INFINIX_API_KEY;

function getSign(body: Record<string, unknown>): string {
  const keys = Object.keys(body).sort();
  const signContent = keys.map((key) => `${key}=${body[key]}`).join("&");
  const hexHmac = crypto
    .createHmac("sha256", API_KEY)
    .update(signContent)
    .digest("hex")
    .toUpperCase();
  return Buffer.from(hexHmac, "utf-8").toString("base64");
}

async function sendCommand(url: string, body: Record<string, unknown>) {
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

async function uploadDevice(imei: string): Promise<number> {
  const expiration = dayjs().add(2, "year").unix();
  let data = await sendCommand("/api/partner/lock/v1/imei/input", {
    imeiInfo: JSON.stringify([{ imei, expiration }]),
    apiKey: API_KEY,
    preLockFlag: false,
  });
  console.log("🚀 ~ uploadDevice ~ data:", data);
  const isSuccess = data.code === 200;
  if (isSuccess) return 200;

  if (data.code === 50021) return 461;

  return data.code;
}

async function getDevice(imei: string): Promise<MDMDevice | undefined> {
  const data = await sendCommand("/api/partner/model/v1/get", {
    imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ getDevice ~ data:", data);
  if (data.message.toLowerCase() !== "success") return;
  const device = data.data;
  const [status, lockStatus] = await Promise.all([
    getDeviceStatus(imei),
    getDeviceLockStatus(imei),
  ]);

  return {
    id: 0,
    deviceStatus: status === "active" ? lockStatus : status,
    phoneModel: `${device.modelMarketName} (${device.ram}+${device.rom}GB)`,
    description: "",
    serialNumber: imei,
    imei,
    activationLockStatus: 0,
    functionRestrictData: "",
    httpProxyStatus: 0,
    commandContentList: [],
    deviceAssignedBy: "",
    color: "",
    usbItunesStatus: 0,
    deviceCapacity: "",
    osVersion: "",
    createTime: "",
    lastOnlineTime: "",
  };
}

async function getDeviceStatus(imei: string): Promise<DeviceStatus> {
  const data = await sendCommand("/api/partner/lock/v1/findLockState", {
    imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ getDeviceStatus ~ data:", data);
  switch (data.data.serverState) {
    case 500:
      return DeviceStatus.activating;
    case 1000:
      return DeviceStatus.activating;
    case 2000:
      return DeviceStatus.activating;
    case 3000:
      return DeviceStatus.active;
    default:
      return DeviceStatus.unknown;
  }
}

async function getDeviceLockStatus(imei: string): Promise<DeviceStatus> {
  const data = await sendCommand("/api/partner/anti-theft/v1/status", {
    imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ getDeviceLockStatus ~ data:", data);
  if (data.code === 200 && data.data.operationStatus === "ON")
    return DeviceStatus.locked;
  return DeviceStatus.active;
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/api/partner/anti-theft/v1/submit", {
    imei,
    contactInformation: `tel: ${phone} ${message}`,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.code === 200;
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/api/partner/anti-theft/v1/close", {
    deviceUid: imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.code === 200;
}

async function sendMessage(imei: string, phone: string, message: string) {
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

async function completeDevice(imei: string) {
  const data = await sendCommand("/api/partner/lock/v1/removeLock", {
    imeiInfo: imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data.code === 200;
}

export default {
  uploadDevice,
  getDevice,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
