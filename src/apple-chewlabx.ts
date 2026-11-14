import dayjs from "dayjs";
import {
  DeviceLocation,
  DevicePermissions,
  DeviceStatus,
  IMDM,
  MDMDevice,
  MDMQuery,
} from ".";
import { getCache } from "./lib/cache";
import { logger } from "./lib/logger";

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
    body?: Record<string, unknown> | FormData,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
  ): Promise<any> {
    if (!this.token) throw new Error("token_not_found");

    const response = await fetch(`${MDM_URL}${url}`, {
      method,
      headers: {
        ...(body instanceof FormData
          ? {}
          : { "content-type": "application/json" }),
        authorization: `Bearer ${this.token}`,
      },
      body:
        method === "GET"
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });

    const text = await response.text();

    let responseBody: unknown = text;
    let parseError: unknown;
    if (!text.trim()) {
      responseBody = undefined;
    } else {
      try {
        responseBody = JSON.parse(text);
      } catch (error) {
        parseError = error;
      }
    }

    const requestBody =
      method === "GET"
        ? undefined
        : body instanceof FormData
          ? Object.fromEntries(
              Array.from(body.entries(), ([key, value]) => [
                key,
                typeof Blob !== "undefined" && value instanceof Blob
                  ? {
                      ...("name" in value ? { name: (value as File).name } : {}),
                      size: value.size,
                      type: value.type,
                    }
                  : value,
              ])
            )
          : body;

    const identifier = this.query.serialNumber || this.query.applicationId;
    const prefix = identifier
      ? `🚀 ~ AppleChewLabxMDM ~ sendCommand ~ ${identifier} ~ ${method} ${url}:`
      : `🚀 ~ AppleChewLabxMDM ~ sendCommand ~ ${method} ${url}:`;
    const logFn =
      !response.ok || parseError !== undefined ? logger.warn : logger.log;

    logFn(prefix, {
      ...(response.ok ? {} : { status: response.status }),
      requestBody,
      responseBody,
    });

    if (!response.ok) {
      throw new Error(`network_error_${response.status}`);
    }

    if (parseError !== undefined) {
      throw parseError;
    }

    return responseBody;
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
      const device = await this.sendCommand(
        `/devices/${this.query.serialNumber}`
      );

      if (!device?.serial_number) throw new Error("device_not_found");

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
      const deviceStatus = this.getDeviceStatus(device.status);

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
        color: device.color,
        createTime: dayjs(device.device_assigned_date).format("YYYYMMDDHHmmss"),
        imei: device.imei,
        usbItunesStatus: device.restrictions.allowUSBRestrictedMode ? 1 : 0,
        deviceCapacity: device.capacity ? `${device.capacity}GB` : "",
        osVersion: device.os_version ?? "",
      };
    } catch (error) {
      logger.warn(
        `getDevice ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  getDeviceStatus(status: string): DeviceStatus {
    switch (status) {
      case "normal":
        return DeviceStatus.active;
      case "deleted":
        return DeviceStatus.completed;
      case "lost_mode":
        return DeviceStatus.locked;
      case "hide_apps":
        return DeviceStatus.rent;
      default:
        return DeviceStatus.unknown;
    }
  }

  async getEscrowKey(): Promise<string | undefined> {
    try {
      const { escrow_key } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/escrow-key`
      );
      return escrow_key;
    } catch (error) {
      logger.warn(
        `getEscrowKey ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/lock`,
        {
          message: content,
          phone: phoneNumber,
          footnote: phoneNumber,
        },
        "PUT"
      );
      return [status === "locking", undefined];
    } catch (error) {
      logger.warn(
        `enableLostMode ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async disableLostMode(): Promise<
    [true, number | undefined] | [false, string | undefined]
  > {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/unlock`,
        undefined,
        "PUT"
      );
      return [status === "unlocking", undefined];
    } catch (error) {
      logger.warn(
        `disableLostMode ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async refreshLocation() {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/locations`,
        undefined,
        "POST"
      );
      return status === "success";
    } catch (error) {
      logger.warn(
        `refreshLocation ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async getLocations() {
    const locations = await this.sendCommand(
      `/devices/${this.query.serialNumber}/locations`
    );
    return locations.map((loc: any) => ({
      lat: loc.latitude,
      lng: loc.longitude,
    })) as DeviceLocation[];
  }

  async removeMDM(password: string) {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}`,
        undefined,
        "DELETE"
      );
      return status === "deleted";
    } catch (error) {
      logger.warn(
        `removeMDM ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async removePassword() {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/passcode`,
        undefined,
        "DELETE"
      );
      return status === "clearing";
    } catch (error) {
      logger.warn(
        `removePassword ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/hide-apps`,
        undefined,
        "PUT"
      );
      return [status === "hiding", undefined];
    } catch (error) {
      logger.warn(
        `hideApp ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async disableHideApp(): Promise<[boolean, number | string | undefined]> {
    return this.disableLostMode();
  }

  async setPermissions(permissions: DevicePermissions) {
    try {
      await this.sendCommand(
        `/devices/${this.query.serialNumber}/restrictions`,
        permissions,
        "PUT"
      );
      return true;
    } catch (error) {
      logger.warn(
        `setPermissions ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
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
      logger.warn(
        `setWallpaper ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async updateOS() {
    try {
      const { status } = await this.sendCommand(
        `/devices/${this.query.serialNumber}/os-update`,
        undefined,
        "POST"
      );
      return status === "scheduling";
    } catch (error) {
      logger.warn(
        `updateOS ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async disableUSB() {
    try {
      await this.sendCommand(
        `/devices/${this.query.serialNumber}/restrictions`,
        { allowUSBRestrictedMode: true },
        "PUT"
      );
      return true;
    } catch (error) {
      logger.warn(
        `disableUSB ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async enableUSB() {
    try {
      await this.sendCommand(
        `/devices/${this.query.serialNumber}/restrictions`,
        { allowUSBRestrictedMode: false },
        "PUT"
      );
      return true;
    } catch (error) {
      logger.warn(
        `enableUSB ~ serialNumber: ${this.query.serialNumber}, error: ${error}`
      );
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
