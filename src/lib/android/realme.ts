import * as crypto from "crypto";
import dayjs from "dayjs";
import { sleep } from "../../apple";
import { MDMAndroidOEMDevice } from "../../types";

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

async function uploadDevice(imei: string): Promise<number> {
  let data = await sendCommand("/flexiblePackage/upload", {
    deviceUid: imei,
    productName: "",
    operationType: 1,
  });
  console.log("🚀 ~ uploadDevice ~ data:", data);
  let isSuccess = data.message === "SUCCESS";
  if (!isSuccess) return 400;

  await sleep(5000);
  data = await sendCommand("/package/bindPackage", {
    deviceUid: imei,
    type: 1,
  });
  console.log("🚀 ~ bindPackage ~ data:", data);
  isSuccess = data.message === "SUCCESS";
  if (isSuccess) return 200;

  return data.error.code;
}

async function getDevice(
  imei: string
): Promise<MDMAndroidOEMDevice | undefined> {
  const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
  console.log("🚀 ~ getDevice ~ data:", data);
  if (data.message !== "SUCCESS") return;
  return {
    id: imei,
    status: data.status.toLowerCase(),
    modelName: data.model,
    createTime: dayjs(data.statusActivatedDate).format("YYYYMMDDHHmmss"),
    lastOnlineTime: dayjs(data.lastSyncTime).format("YYYYMMDDHHmmss"),
  };
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/lock", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.result === "SUCCESS";
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/unlock", { deviceUid: imei });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.result === "SUCCESS";
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand("/sendMessage", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data.result === "SUCCESS";
}

async function completeDevice(imei: string) {
  const data = await sendCommand("/complete", { deviceUid: imei });
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data.result === "SUCCESS";
}

export default {
  uploadDevice,
  getDevice,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
