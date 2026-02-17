import crypto from "crypto";
import dayjs from "dayjs";
import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
import { getCache } from "./lib/cache";
import { Wallpaper } from "./types";

const MDM_URL = process.env.MDM_SEEKDREAM_URL;
const MDM_USERNAME = process.env.MDM_SEEKDREAM_USERNAME;
const MDM_PASSWORD = process.env.MDM_SEEKDREAM_PASSWORD;
const MDM_API_KEY = process.env.MDM_SEEKDREAM_API_KEY;
const MDM_SEEKDREAM_SECOND_PASSWORD = process.env.MDM_SEEKDREAM_SECOND_PASSWORD;

export class AndroidSeekDreamMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;

  static async getInstance(query: MDMQuery) {
    const instance = new AndroidSeekDreamMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "androidSeekDreamMDMToken";
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
            username: MDM_USERNAME,
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
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    try {
      const params = new URLSearchParams();
      params.append("serial", this.query.serialNumber);
      params.append("current", "1");
      params.append("pageSize", "20");

      const response = await this.sendCommand(
        `/google/getDeviceList?${params}`
      );
      const {
        data: {
          lists: [device],
        },
      } = await response.json();

      if (!device) return undefined;

      return {
        id: device.device_id,
        deviceStatus: device.status_flag,
        description: "",
        serialNumber: device.dc_info.hardwareInfo.serialNumber,
        activationLockStatus: 1,
        functionRestrictData: "",
        httpProxyStatus: 0,
        phoneModel: device.dc_info.hardwareInfo.model,
        commandContentList: null,
        deviceAssignedBy: "",
        color: null,
        createTime: dayjs(device.add_time).format("YYYYMMDDHHmmss"),
        merchantId: device.merchant_id,
        imei: device.imei,
      };
    } catch {
      return;
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | null]> {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/lock", {
        serial: this.query.serialNumber,
        merchant_id: this.query.merchantId,
        phone: phoneNumber,
        content,
      });
      const { code } = await response.json();
      return [code === 200, null];
    } catch (error) {
      console.error(error);
      return [false, null];
    }
  }

  async disableLostMode(): Promise<[boolean, number | null]> {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/unlock", {
        serial: this.query.serialNumber,
        merchant_id: this.query.merchantId,
      });
      const { code } = await response.json();
      return [code === 200, null];
    } catch (error) {
      console.error(error);
      return [false, null];
    }
  }

  async getLocations() {
    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    const params = new URLSearchParams();
    params.append("serial", this.query.serialNumber);
    params.append("current", "1");
    params.append("pageSize", "20");
    params.append("merchant_id", this.query.merchantId);

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

  async removeMDM(password: string) {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/disown", {
        serial: this.query.serialNumber,
        secondPassword: password,
        merchant_id: this.query.merchantId,
      });
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async removePassword() {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/clearPassword", {
        serial: this.query.serialNumber,
        merchant_id: this.query.merchantId,
      });
      const data = await response.json();
      console.log("🚀 ~ AndroidSeekDreamMDM ~ clearPassword ~ data:", data);
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | null]> {
    return [false, null];
  }

  async getWallpapers() {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const params = new URLSearchParams();
      params.append("current", "1");
      params.append("pageSize", "8");
      params.append("merchant_id", this.query.merchantId);

      const response = await this.sendCommand(`/user/wallpaper?${params}`);
      const { data } = await response.json();
      return data.list.map(
        ({ wp_id, wp_url }: { wp_id: number; wp_url: string }) => ({
          id: wp_id,
          url: wp_url,
        })
      ) as Wallpaper[];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async setWallpaper(changeable: boolean, wallpaperId?: number) {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/pushWallpaper", {
        serial: this.query.serialNumber,
        wp_type: "3",
        wp_id: wallpaperId,
        allowed: changeable ? "1" : "0",
        merchant_id: this.query.merchantId,
      });
      const data = await response.json();
      console.log("🚀 ~ AndroidSeekDreamMDM ~ setWallpaper ~ data:", data);
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getCredit() {
    return { credit: 0 };
  }

  async reboot() {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/reboot", {
        serial: this.query.serialNumber,
        merchant_id: this.query.merchantId,
      });
      const data = await response.json();
      console.log("🚀 ~ AndroidSeekDreamMDM ~ reboot ~ data:", data);
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async playSound() {
    if (this.query.brand !== "android-seekdream")
      throw new Error("invalid_brand");

    if (!this.query.merchantId) throw new Error("merchant_id_not_found");

    try {
      const response = await this.sendCommand("/google/playSound", {
        serial: this.query.serialNumber,
        merchant_id: this.query.merchantId,
      });
      const data = await response.json();
      console.log("🚀 ~ AndroidSeekDreamMDM ~ playSound ~ data:", data);
      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
