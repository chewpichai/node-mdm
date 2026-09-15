import dayjs from "dayjs";
import { sleep } from "../../../apple";
import { MDMAndroidOEMDevice } from "../../../types";
import { oGuardSign, possefySign } from "./sign";

const BASE_URL = "https://ilockcardf-isp.apps.coloros.com";
const CARRIER_CODE = process.env.OPPO_CARRIER_CODE;

async function validateDevice(imei: string): Promise<Response> {
  const { timestamp, signature } = possefySign(JSON.stringify({ imei }));
  return fetch(
    "https://openapi.possefy.co.th/api/v1/sleasing/device-validate-imei",
    {
      method: "POST",
      body: JSON.stringify({ imei }),
      headers: {
        "Content-Type": "application/json",
        "App-Timestamp": timestamp,
        "App-Signature": signature,
      },
    }
  );
}

async function sendCommand(url: string, body: Record<string, unknown>) {
  const response = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-carrier-code": CARRIER_CODE,
      "x-transactionId": Date.now().toString(),
      "x-sign": oGuardSign(JSON.stringify(body)),
    },
  });
  const data = await response.json();
  console.log("🚀 ~ sendCommand ~ data:", data);
  return data;
}

async function uploadDevice(imei: string): Promise<number> {
  const response = await validateDevice(imei);
  if (response.status !== 200) return response.status;

  let data = await response.json();
  console.log("🚀 ~ uploadDevice ~ data:", data);
  let isSuccess = data.success;
  if (!isSuccess) return data.code === "NOT_FOUND" ? 461 : 400;

  await sleep(5000);
  data = await sendCommand("/setmeal/choose", {
    deviceUid: imei,
    type: 1,
  });
  console.log("🚀 ~ bindPackage ~ data:", data);
  isSuccess = data.result === "SUCCESS";
  if (isSuccess) return 200;

  return data.error?.code || 400;
}

async function getDevice(
  imei: string
): Promise<MDMAndroidOEMDevice | undefined> {
  let modelName = null;
  const response = await validateDevice(imei);
  if (response.status === 200)
    modelName = (await response.json()).data?.model_name;

  const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
  console.log("🚀 ~ getDevice ~ data:", data);
  if (data.message !== "SUCCESS" || data.data.list.length === 0) return;
  const device = data.data.list[0];
  return {
    id: imei,
    status: getDeviceStatus(device.status.toLowerCase()),
    modelName: modelName || device.model,
    createTime: dayjs(device.statusActivatedDate).format("YYYYMMDDHHmmss"),
    lastOnlineTime: dayjs(device.lastSyncTime).format("YYYYMMDDHHmmss"),
  };
}

function getDeviceStatus(status: string) {
  switch (status) {
    case "normal":
      return "active";
    default:
      return status;
  }
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/lock", {
    deviceUid: imei,
    title: phone,
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
    title: phone,
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
