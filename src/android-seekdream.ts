import crypto from "crypto";
import dayjs from "dayjs";
import {
  DeviceLocation,
  DevicePermissions,
  IMDM,
  MDMDevice,
  MDMQuery,
} from ".";
import { getCache } from "./lib/cache";
import { MDMDeviceDetail } from "./types";

const MDM_URL = process.env.MDM_SEEKDREAM_URL;
const MDM_USERNAME = process.env.MDM_SEEKDREAM_USERNAME;
const MDM_PASSWORD = process.env.MDM_SEEKDREAM_PASSWORD;
const MDM_API_KEY = process.env.MDM_SEEKDREAM_API_KEY;

export class AndroidMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;

  static async getInstance(query: MDMQuery) {
    const instance = new AndroidMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "androidMDMToken";
    this.token = null;
    this.query = query;
  }

  async sendCommand(url: string, data?: Record<string, unknown>) {
    if (!this.token) throw new Error("token_not_found");

    return await fetch(`${MDM_URL}${url}`, {
      method: data ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MDM_API_KEY,
        token: this.token,
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async init() {
    if (this.token) return;

    const cache = getCache();
    this.token = cache.get(this.tokenKey);

    if (!this.token) {
      try {
        const hash = crypto
          .createHash("md5")
          .update(MDM_PASSWORD)
          .digest("hex");
        const response = await fetch(`${MDM_URL}/user/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": MDM_API_KEY,
          },
          body: JSON.stringify({
            role: "agent",
            login: MDM_USERNAME,
            password: crypto
              .createHash("md5")
              .update(hash.slice(7, -7))
              .digest("hex"),
          }),
        });
        const { token } = await response.json();
        this.token = token;
        cache.set(this.tokenKey, token, 60 * 60);
      } catch {
        this.token = "error";
      }
    }
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "android") throw new Error("invalid_brand");
    try {
      const params = new URLSearchParams();
      params.append("serial", this.query.serialNumber);
      params.append("lang", "en-US");
      const response = await this.sendCommand(
        `/google/getDeviceDetail?${params}`
      );
      const { data: device } = await response.json();

      if (!device) return undefined;

      return {
        id: device.device_id,
        deviceStatus: 1,
        description: "",
        serialNumber: device.serial,
        activationLockStatus: 1,
        functionRestrictData: "",
        httpProxyStatus: 0,
        phoneModel: device.hardwareInfo.model,
        commandContentList: null,
        deviceAssignedBy: "",
        color: null,
        createTime: dayjs(device.add_time).format("YYYYMMDDHHmmss"),
      };
    } catch {
      return;
    }
  }

  async getDeviceDetail(
    deviceId?: number
  ): Promise<MDMDeviceDetail | undefined> {
    return;
  }

  async getEscrowKey(): Promise<string | undefined> {
    return;
  }

  async enableLostMode(phoneNumber: string, content: string) {
    if (this.query.brand !== "android") throw new Error("invalid_brand");
    try {
      const response = await this.sendCommand("/google/lock", {
        serial: this.query.serialNumber,
        phone: phoneNumber,
        content,
      });
      const { status } = await response.json();
      return status === "OK";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async disableLostMode() {
    if (this.query.brand !== "android") throw new Error("invalid_brand");
    try {
      const response = await this.sendCommand("/google/unlock", {
        serial: this.query.serialNumber,
      });
      const { status } = await response.json();
      return status === "OK";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async refreshLocation() {
    return false;
  }

  async getLocations() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    const params = new URLSearchParams();
    params.append("serial", this.query.serialNumber);
    params.append("current", "1");
    params.append("pageSize", "20");
    const response = await this.sendCommand(`/google/getLocations?${params}`);
    const { data } = await response.json();
    return data.list.map(
      ({
        location: { lat, lng },
      }: {
        location: { lat: string; lng: string };
      }) => ({ lat, lng })
    ) as DeviceLocation[];
  }

  async enableSupervision() {
    return;
  }

  async removeMDM() {
    if (this.query.brand !== "android") throw new Error("invalid_brand");
    try {
      const response = await this.sendCommand("/google/disown", {
        serial: this.query.serialNumber,
        secondPassword: "123456",
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async removePassword() {
    return false;
  }

  async hideApp() {
    return false;
  }

  async setPermissions(permissions: DevicePermissions) {
    return false;
  }

  async disableProxy() {
    return false;
  }

  async enableProxy() {
    return false;
  }

  async getWallpaper() {
    throw new Error("method_not_implemented");
  }

  async uploadWallpaper(wallpaper: string) {
    return false;
  }

  async setWallpaper() {
    if (this.query.brand !== "android") throw new Error("invalid_brand");
    try {
      const response = await this.sendCommand("/google/pushWallpaper", {
        serial: this.query.serialNumber,
        wp_type: "3",
        wp_id: "1",
        allowed: "0",
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async setADB(enabled: boolean) {
    throw new Error("method_not_implemented");
  }

  async setFactoryReset(enabled: boolean) {
    throw new Error("method_not_implemented");
  }

  async getCredit() {
    return { credit: 0 };
  }
}
