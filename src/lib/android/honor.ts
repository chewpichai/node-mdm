import * as crypto from "crypto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DeviceStatus, MDMDevice } from "../../types";

dayjs.extend(utc);

const BASE_URL = "https://apigw.yun.hihonor.com/api/devicelock/v1";
const APP_ID = process.env.HONOR_APP_ID;
const APP_KEY = process.env.HONOR_APP_KEY;

function getSign(
  body: string,
  date: string,
  urlStr: string,
  method: string
): string {
  const url = new URL(urlStr);
  const pathname = url.pathname.slice(4);
  const params = url.searchParams.toString().replaceAll("&", "|");
  const dataToSign = `${pathname}|${method}|${params ? params + "|" : ""}${date}|${APP_ID}|${APP_KEY}`;
  return crypto
    .createHash("sha256")
    .update(dataToSign, "utf8")
    .digest("base64");
}

async function sendCommand(
  path: string,
  body: Record<string, unknown>,
  method: string = "POST"
) {
  const url = `${BASE_URL}${path}`;
  const date = dayjs.utc().format("YYYYMMDD[T]HHmmss[Z]");
  const response = await fetch(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "X-RY-ID": APP_ID,
      "X-RY-DATE": date,
      "X-RY-SIGN": getSign(JSON.stringify(body), date, url, method),
    },
  });
  const data = await response.json();
  return data;
}

async function uploadDevice(
  imei: string,
  productCode?: string
): Promise<number> {
  let data = await sendCommand("/devices/import", { deviceInfos: [imei] });
  console.log("🚀 ~ uploadDevice ~ data:", data);
  return data.message === "success" ? 200 : data.code;
}

async function getDevice(imei: string): Promise<MDMDevice | undefined> {
  const params = new URLSearchParams({
    pageNum: "1",
    pageSize: "10",
    registeredId: imei,
  });
  const data = await sendCommand(`/devices?${params.toString()}`, {}, "GET");
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
  const data = await sendCommand("/lock/deliver", {
    registeredIds: [imei],
    lockPolicy: {
      content: message,
      contactNumber: phone,
      allowApp: false,
      supportUserRefresh: true,
      forbidIncomingCall: false,
    },
  });
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.message === "success";
}

async function unlockDevice(imei: string) {
  const data = await sendCommand("/unlock/deliver", {
    registeredIds: [imei],
    unlockPolicy: {},
  });
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.message === "success";
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand("/remind/deliver", {
    registeredIds: [imei],
    remindPolicy: {
      title: "Remind",
      content: message,
      contactNumber: phone,
      showType: 1,
    },
  });
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data.message === "success";
}

async function completeDevice(imei: string) {
  const data = await sendCommand("/unbind/deliver", { registeredIds: [imei] });
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
