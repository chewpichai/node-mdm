import * as crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DeviceStatus, MDMDevice } from "../../types";

dayjs.extend(utc);

const BASE_URL = "https://vdmsvn.ztems.com/vdms20/api/north";
const KEY_ID = process.env.NUBIA_KEY_ID;
const KEY_SECRET = process.env.NUBIA_KEY_SECRET;

function getSign(body: string, timestamp: number): string {
  const raw = `accessKeyId=${KEY_ID}&timestamp=${timestamp}&body=${body}&${KEY_SECRET}`;
  return crypto.createHash("md5").update(raw, "utf8").digest("hex");
}

async function sendCommand(
  path: string,
  body: Record<string, unknown> | Array<any>
) {
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

async function uploadDevice(imei: string): Promise<number> {
  let data = await sendCommand("/enroll", [{ imei }]);
  console.log("🚀 ~ uploadDevice ~ data:", data);
  return data.message === "success" ? 200 : data.code;
}

async function getDevice(imei: string): Promise<MDMDevice | undefined> {
  const data = await sendCommand("/get-model", [{ imei }]);
  console.log("🚀 ~ getDevice ~ data:", data);
  if (data.message !== "success" || data.data.length === 0) return;

  const device: {
    createTime: string;
    registeredId: string;
    registeredId2: string;
    modelName: string;
    modifyAccount: string;
    modifyTime: string;
    status: number;
    adbStatus: number;
  } = data.data[0];

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
    createTime: dayjs(device.createTime).format("YYYYMMDDHHmmss"),
    lastOnlineTime: dayjs(device.modifyTime).format("YYYYMMDDHHmmss"),
  };
}

function getDeviceStatus(status: number): DeviceStatus {
  switch (status) {
    case 0:
      return DeviceStatus.activating;
    case 1:
      return DeviceStatus.active;
    case 2:
      return DeviceStatus.locked;
    case 3:
      return DeviceStatus.completed;
    case 11:
      return DeviceStatus.lock;
    case 12:
      return DeviceStatus.unlocking;
    case 13:
      return DeviceStatus.completed;
    default:
      return DeviceStatus.unknown;
  }
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand("/lock", {
    imei,
    lockInfoList: [{ type: "LOCK_PHONE" }],
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.message === "success";
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/unlock", {
    imei,
    lockInfoList: [{ type: "LOCK_PHONE" }],
  });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.message === "success";
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand("/alert", {
    imei,
    alertMessage: message,
  });
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data.message === "success";
}

async function completeDevice(imei: string) {
  const data = await sendCommand("/deregister", [{ imei }]);
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data.message === "success";
}

export default {
  uploadDevice,
  getDevice,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
