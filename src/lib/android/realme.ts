import * as crypto from "crypto";

const BASE_URL = "https://ilockcardf-isp.realme.com";
const CARRIER_CODE = process.env.REALME_CARRIER_CODE;
const TOKEN = process.env.REALME_TOKEN;

function getSign(body: string): string {
  const dataToSign = `${body},${CARRIER_CODE},${TOKEN}`;
  return crypto
    .createHash("sha256")
    .update(dataToSign, "utf8")
    .digest("base64");
}

async function sendCommand(url: string, body: Record<string, unknown>) {
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

async function getDeviceStatus(imei: string) {
  const data = await sendCommand("/getStatus", { deviceUid: imei });
  console.log("🚀 ~ getDeviceStatus ~ data:", data);
  return data;
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/lock", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data;
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/unlock", { deviceUid: imei });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data;
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand("/sendMessage", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data;
}

async function completeDevice(imei: string) {
  const data = await sendCommand("/complete", { deviceUid: imei });
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
