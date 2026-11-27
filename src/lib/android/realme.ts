import * as crypto from "crypto";
import dayjs from "dayjs";
import { sleep } from "../../apple";
import { DeviceStatus, MDMDevice } from "../../types";
import { logger } from "../logger";

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
  return data;
}

async function uploadDevice(
  imei: string,
  productCode?: string
): Promise<number> {
  let data = await sendCommand("/flexiblePackage/upload", {
    deviceUid: imei,
    productName: productCode,
    operationType: 1,
  });
  logger.log(`🚀 ~ ${imei} ~ uploadDevice ~ data:`, data);
  let isSuccess = data.message.toLowerCase() === "success";
  if (!isSuccess) return 400;

  await sleep(5000);
  data = await sendCommand("/package/bindPackage", {
    deviceUid: imei,
    type: 1,
  });
  logger.log(`🚀 ~ ${imei} ~ bindPackage ~ data:`, data);
  isSuccess = data.result.toLowerCase() === "success";
  if (isSuccess) return 200;

  return data.error.code;
}

async function getDevice(imei: string): Promise<MDMDevice | undefined> {
  const data = await sendCommand("/getDeviceStatus", { deviceUid: imei });
  logger.log(`🚀 ~ ${imei} ~ getDevice ~ data:`, data);
  if (data.message.toLowerCase() !== "success" || data.data.list.length === 0)
    return;

  const device = data.data.list[0];

  return {
    id: 0,
    deviceStatus: getDeviceStatus(device.status.toLowerCase()),
    phoneModel: device.marketingName || device.model,
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
    createTime: dayjs(device.statusActivatedDate).format("YYYYMMDDHHmmss"),
    lastOnlineTime: dayjs(device.lastSyncTime).format("YYYYMMDDHHmmss"),
  };
}

function getDeviceStatus(status: string): DeviceStatus {
  switch (status) {
    case "normal":
      return DeviceStatus.active;
    default:
      return status as DeviceStatus;
  }
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/lock", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  logger.log(`🚀 ~ ${imei} ~ lockDevice ~ data:`, data);
  return data.result.toLowerCase() === "success";
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/unlock", { deviceUid: imei });
  logger.log(`🚀 ~ ${imei} ~ unlockDevice ~ data:`, data);
  return data.result.toLowerCase() === "success";
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand("/sendMessage", {
    deviceUid: imei,
    tel: phone,
    message,
  });
  logger.log(`🚀 ~ ${imei} ~ sendMessage ~ data:`, data);
  return data.result.toLowerCase() === "success";
}

async function deleteDevice(imei: string) {
  let data = await sendCommand("/package/deletePackage", {
    deviceId: imei,
    type: 1,
  });
  logger.log(`🚀 ~ ${imei} ~ deletePackage ~ data:`, data);
  const isSuccess = data.result.toLowerCase() === "success";
  if (!isSuccess) return false;

  await sleep(5000);

  data = await sendCommand("/flexiblePackage/upload", {
    deviceUid: imei,
    operationType: 0,
  });
  logger.log(`🚀 ~ ${imei} ~ deleteDevice ~ data:`, data);
  return data.message.toLowerCase() === "success";
}

async function completeDevice(imei: string) {
  const device = await getDevice(imei);
  if (device?.deviceStatus === DeviceStatus.activating)
    return deleteDevice(imei);

  const data = await sendCommand("/complete", { deviceUid: imei });
  logger.log(`🚀 ~ ${imei} ~ completeDevice ~ data:`, data);
  return data.result.toLowerCase() === "success";
}

export default {
  uploadDevice,
  getDevice,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
