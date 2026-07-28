import * as crypto from "crypto";

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
  console.log("🚀 ~ sendCommand ~ data:", data);
  return data;
}

async function getDeviceStatus(imei: string) {
  const data = await sendCommand("/api/partner/lock/v1/findLockState", {
    imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ getDeviceStatus ~ data:", data);
  return data;
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/api/partner/anti-theft/v1/submit", {
    imei,
    contactInformation: `tel: ${phone} ${message}`,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data;
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/api/partner/anti-theft/v1/close", {
    deviceUid: imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data;
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
  return data;
}

async function completeDevice(imei: string) {
  const data = await sendCommand("/api/partner/lock/v1/removeLock", {
    imeiInfo: imei,
    apiKey: API_KEY,
  });
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data;
}

export default {
  getDeviceStatus,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
