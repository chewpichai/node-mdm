import dayjs from "dayjs";
import {
  DeviceLocation,
  DevicePermissions,
  IMDM,
  MDMDevice,
  MDMQuery,
} from ".";
import { getCache } from "./lib/cache";

const MDM_URL = process.env.MDM_CHEWLABX_URL;
const MDM_USERNAME = process.env.MDM_CHEWLABX_USERNAME;
const MDM_PASSWORD = process.env.MDM_CHEWLABX_PASSWORD;

export class AppleChewLabxMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;

  static async getInstance(query: MDMQuery) {
    const instance = new AppleChewLabxMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "appleChewLabxMDMToken";
    this.token = null;
    this.query = query;
  }

  async sendCommand(
    url: string,
    data?: Record<string, unknown> | FormData,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
  ) {
    if (!this.token) throw new Error("token_not_found");

    return await fetch(`${MDM_URL}${url}`, {
      method,
      headers: {
        ...(data instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        authorization: `Bearer ${this.token}`,
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async init() {
    if (this.token) return;

    const cache = getCache();
    this.token = cache.get(this.tokenKey);

    if (!this.token) {
      try {
        const response = await fetch(`${MDM_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: MDM_USERNAME,
            password: MDM_PASSWORD,
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
    if (this.query.brand !== "apple-chewlabx") throw new Error("invalid_brand");

    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}`
      );
      const device = await response.json();

      if (
        this.query.serialNumber &&
        device.serial_number !== this.query.serialNumber
      ) {
        throw new Error("device_not_found");
      }

      const functionRestrictData = JSON.stringify(
        Object.fromEntries(
          Object.entries(device.restrictions).map(([key, value]) => [
            key,
            value ? "true" : "false",
          ])
        )
      );

      const statusMap: Record<string, MDMDevice["deviceStatus"]> = {
        normal: 0,
        deleted: 2,
        lost_mode: 3,
        hide_apps: 4,
      };
      const deviceStatus = statusMap[device.status] ?? 1;

      return {
        id: device.id,
        deviceStatus,
        description: device.description,
        serialNumber: device.serial_number,
        activationLockStatus: 1,
        functionRestrictData,
        httpProxyStatus: 0,
        phoneModel: device.model,
        commandContentList: null,
        deviceAssignedBy: device.device_assigned_by,
        color: null,
        createTime: dayjs(device.device_assigned_date).format("YYYYMMDDHHmmss"),
        imei: device.imei,
        usbItunesStatus: device.restrictions.allowUSBRestrictedMode ? 1 : 0,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async getEscrowKey(): Promise<string | undefined> {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/escrow-key`
      );
      const { escrowKey } = await response.json();
      return escrowKey;
    } catch (error) {
      console.error(error);
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/lock`,
        {
          message: content,
          phone: phoneNumber,
        },
        "PUT"
      );
      const { status } = await response.json();
      return [status === "locking", undefined];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async disableLostMode(): Promise<[boolean, number | undefined]> {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/unlock`,
        undefined,
        "PUT"
      );
      const { status } = await response.json();
      return [status === "unlocking", undefined];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async refreshLocation() {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/locations`,
        undefined,
        "POST"
      );
      const { status } = await response.json();
      return status === "success";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getLocations() {
    const response = await this.sendCommand(
      `/devices/${this.query.serialNumber}/locations`
    );
    const locations = await response.json();
    return locations.map((loc: any) => ({
      lat: loc.latitude,
      lng: loc.longitude,
    })) as DeviceLocation[];
  }

  async removeMDM(password: string) {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/remove`,
        undefined,
        "DELETE"
      );
      const { status } = await response.json();
      return status === "deleted";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async removePassword() {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/passcode`,
        undefined,
        "DELETE"
      );
      const { status } = await response.json();
      return status === "clearing";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/hide-apps`,
        undefined,
        "PUT"
      );
      const { status } = await response.json();
      return [status === "hiding", undefined];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async setPermissions(permissions: DevicePermissions) {
    try {
      await this.sendCommand(
        `/devices/${this.query.serialNumber}/restrictions`,
        Object.fromEntries(
          Object.entries(permissions).map(([key, value]) => [
            key,
            value === "true",
          ])
        ),
        "PUT"
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async setWallpaper(changeable: boolean, wallpaper?: number | File) {
    if (!wallpaper) throw new Error("wallpaper_not_found");

    try {
      const formData = new FormData();
      formData.append("image", wallpaper as File);
      formData.append("changeable", changeable ? "1" : "0");
      await this.sendCommand(
        `/devices/${this.query.serialNumber}/wallpaper`,
        formData,
        "PUT"
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async updateOS() {
    try {
      const response = await this.sendCommand(
        `/devices/${this.query.serialNumber}/os-update`,
        undefined,
        "POST"
      );
      const { status } = await response.json();
      return status === "scheduling";
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async clearCommand() {
    try {
      throw new Error("not_implemented");
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async uploadWallpaper(wallpaper: string) {
    return true;
  }

  async getCredit() {
    return { credit: 0 };
  }
}
