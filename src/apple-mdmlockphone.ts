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

const MDM_URL = process.env.MDM_MDMLOCKPHONE_URL;
const MDM_APPID = process.env.MDM_MDMLOCKPHONE_APPID;
const MDM_APPSECRET = process.env.MDM_MDMLOCKPHONE_APPSECRET;

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AppleMDMLockPhoneMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;
  refreshKey: string;
  refreshToken: string | null | undefined;

  static async getInstance(query: MDMQuery) {
    const instance = new AppleMDMLockPhoneMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "appleMDMLockPhoneMDMToken";
    this.token = null;
    this.query = query;
    this.refreshKey = "appleMDMLockPhoneMDMRefreshToken";
    this.refreshToken = null;
  }

  async sendCommand(
    url: string,
    data?: Record<string, unknown>,
    retry = 0
  ): Promise<any> {
    if (!this.token) throw new Error("token_not_found");

    const response = await fetch(`${MDM_URL}${url}`, {
      method: data ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });

    const text = await response.text();

    if (!response.ok) {
      if (retry < 3) {
        if (response.status === 429) await sleep(1000);
        else if (response.status === 402) {
          this.token = null;
          this.refreshToken = null;
          const cache = getCache();
          cache.del(this.tokenKey);
          cache.del(this.refreshKey);
          await this.init();
        }
        return this.sendCommand(url, data, retry + 1);
      }
      console.log(text);
      throw new Error(`network_error_${response.status}`);
    }

    try {
      const data = JSON.parse(text);

      if (data.code !== 200)
        console.log("🚀 ~ AppleMDMLockPhoneMDM ~ sendCommand ~ data:", data);

      return data;
    } catch (error) {
      console.log(text);
      throw error;
    }
  }

  async init() {
    if (this.token) return;

    const cache = getCache();
    this.token = cache.get(this.tokenKey);
    this.refreshToken = cache.get(this.refreshKey);

    if (!this.token && !this.refreshToken) {
      try {
        const response = await fetch(`${MDM_URL}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appid: MDM_APPID,
            appSecret: MDM_APPSECRET,
          }),
        });
        const { data } = await response.json();
        this.token = data.accessToken;
        this.refreshToken = data.refreshToken;
        cache.set(this.tokenKey, data.accessToken, 50 * 60);
        cache.set(this.refreshKey, data.refreshToken, 100 * 60);
        return;
      } catch {
        this.token = null;
        this.refreshToken = null;
      }
    }

    if (!this.token && this.refreshToken) {
      try {
        const response = await fetch(`${MDM_URL}/refreshToken`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        const { data } = await response.json();
        this.token = data.accessToken;
        this.refreshToken = data.refreshToken;
        cache.set(this.tokenKey, data.accessToken, 50 * 60);
        cache.set(this.refreshKey, data.refreshToken, 100 * 60);
        return;
      } catch {
        this.token = null;
        this.refreshToken = null;
      }
    }
  }

  async getDeviceStatus(): Promise<DeviceStatus> {
    try {
      const {
        data: { rentModeStatus, lostModeStatus },
      } = await this.sendCommand("/device/status", {
        serialNo: this.query.serialNumber,
      });
      return lostModeStatus === "1"
        ? DeviceStatus.LOST_LOCKED
        : rentModeStatus === "1"
          ? DeviceStatus.RENT_LOCKED
          : DeviceStatus.SUPERVISED;
    } catch (error) {
      return DeviceStatus.UNREGULATED;
    }
  }

  async getUSBItunesStatus() {
    try {
      const { data } = await this.sendCommand("/device/usb/status", {
        serialNo: this.query.serialNumber,
      });
      return data;
    } catch (error) {
      console.warn(
        `getUSBItunesStatus ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async getHttpProxyStatus() {
    try {
      const { data } = await this.sendCommand("/device/http_proxy/status", {
        serialNo: this.query.serialNumber,
      });
      return data;
    } catch (error) {
      console.warn(
        `getHttpProxyStatus ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const body = await this.sendCommand("/devicePage", {
        current: 1,
        serialNumber: this.query.serialNumber,
        contractCode: this.query.serialNumber
          ? undefined
          : this.query.applicationId,
        size: 10,
      });

      if (body.code !== 200) {
        console.log(body);
        throw new Error(
          `device_not_found_${this.query.serialNumber || this.query.applicationId}`
        );
      }

      const {
        data: { records },
      } = body;
      const device = records.filter((d: any) => d.isdelete === 0).at(0);

      if (
        !device ||
        (this.query.serialNumber &&
          this.query.serialNumber !== device.sserialno)
      ) {
        console.log(this.query.serialNumber, device?.sserialno);
        throw new Error(
          `device_not_found_${this.query.serialNumber || this.query.applicationId}`
        );
      }

      this.query.serialNumber = device.sserialno;
      this.query.mdmId = device.id;

      const [
        functionRestrictData,
        deviceStatus,
        httpProxyStatus,
        usbItunesStatus,
      ] = await Promise.all([
        this.getFunctionRestrictions(device.id),
        this.getDeviceStatus(),
        this.getHttpProxyStatus(),
        this.getUSBItunesStatus(),
      ]);

      return {
        id: device.id,
        deviceStatus,
        description: device.salesRegion ?? device.description,
        serialNumber: device.sserialno,
        activationLockStatus: device.ilockstatus,
        functionRestrictData: JSON.stringify(functionRestrictData),
        httpProxyStatus,
        phoneModel: device.smodel,
        commandContentList: [],
        deviceAssignedBy: device.deviceAssignedBy,
        color: device.color,
        createTime: dayjs(device.tcreatetime).format("YYYYMMDDHHmmss"),
        imei: device.simei,
        usbItunesStatus,
        deviceCapacity: `${device.capacity}GB`,
        osVersion: device.sosversion,
        lastOnlineTime: dayjs(device.tlastusetime).format("YYYYMMDDHHmmss"),
      };
    } catch (error) {
      console.warn(
        `getDevice ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async getFunctionRestrictions(deviceId: number) {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const {
        data: { functionRestrictData },
      } = await this.sendCommand("/function", {
        deviceId,
      });
      return Object.fromEntries(
        Object.entries(functionRestrictData).map(([key, value]) => {
          if (!["forceAutomaticDateAndTime", "forceWiFiPowerOn"].includes(key))
            return [key, !value];
          return [key, value];
        })
      ) as unknown as DevicePermissions;
    } catch (error) {
      console.warn(
        `getFunctionRestrictions ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async getEscrowKey(): Promise<string | undefined> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const {
        data: [code],
      } = await this.sendCommand("/unlock/code", {
        serialNo: this.query.serialNumber,
      });
      return code.passCode;
    } catch (error) {
      console.warn(
        `getEscrowKey ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    try {
      const data = await this.sendCommand("/lock", {
        appid: MDM_APPID,
        isLocationNow: 1,
        lostMidInfo: content,
        lostPhoneNum: phoneNumber,
        serialNo: this.query.serialNumber,
      });
      return [data.code === 200, undefined];
    } catch (error) {
      console.warn(
        `enableLostMode ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async disableLostMode(): Promise<
    [true, number | undefined] | [false, string | undefined]
  > {
    try {
      const data = await this.sendCommand("/unlock", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      return [data.code === 200, undefined];
    } catch (error) {
      console.warn(
        `disableLostMode ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async refreshLocation() {
    const data = await this.sendCommand("/location", {
      appid: MDM_APPID,
      serialNo: this.query.serialNumber,
    });
    return data.code === 200;
  }

  async getLocations(): Promise<DeviceLocation[]> {
    const { data } = await this.sendCommand("/location/data", {
      serialNo: this.query.serialNumber,
    });
    return data.map((l: any) => ({
      lat: Number(l.latitude),
      lng: Number(l.longitude),
    })) as DeviceLocation[];
  }

  async removeMDM(password: string) {
    try {
      const data = await this.sendCommand("/unbindOnce", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `removeMDM ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async removePassword() {
    try {
      const data = await this.sendCommand("/clearLock", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `removePassword ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const data = await this.sendCommand("/collectRent", {
        serialNo: this.query.serialNumber,
        type: "1",
      });
      return [data.code === 200, undefined];
    } catch (error) {
      console.warn(
        `hideApp ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async disableHideApp(): Promise<[boolean, number | undefined]> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const data = await this.sendCommand("/collectRent", {
        serialNo: this.query.serialNumber,
        type: "0",
      });
      return [data.code === 200, undefined];
    } catch (error) {
      console.warn(
        `disableHideApp ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return [false, undefined];
    }
  }

  async setPermissions(permissions: DevicePermissions) {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const formattedPermissions = Object.fromEntries(
        Object.entries(permissions).map(([key, value]) => {
          if (!["forceAutomaticDateAndTime", "forceWiFiPowerOn"].includes(key))
            return [key, !value];
          return [key, value];
        })
      );
      const data = await this.sendCommand("/setFunction", {
        deviceId: this.query.mdmId,
        ...formattedPermissions,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `setPermissions ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async disableProxy() {
    try {
      const data = await this.sendCommand("/http/proxy", {
        serialNo: this.query.serialNumber,
        operationType: 0,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `disableProxy ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async enableProxy() {
    try {
      const data = await this.sendCommand("/http/proxy", {
        serialNo: this.query.serialNumber,
        operationType: 1,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `enableProxy ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async uploadWallpaper(wallpaper: string) {
    return true;
  }

  async setWallpaper(changeable: boolean, wallpaper?: number | string) {
    try {
      const data = await this.sendCommand("/setWallpaper", {
        appid: MDM_APPID,
        paperLimit: changeable ? "0" : "1",
        paperType: "3",
        paperUrl: wallpaper,
        serialNo: this.query.serialNumber,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `setWallpaper ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async disableUSB() {
    try {
      const data = await this.sendCommand("/policy/usb", {
        serialNo: this.query.serialNumber,
        operationType: 0,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `disableUSB ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async enableUSB() {
    try {
      const data = await this.sendCommand("/policy/usb", {
        serialNo: this.query.serialNumber,
        operationType: 1,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `enableUSB ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async updateOS() {
    try {
      const data = await this.sendCommand("/apple/gdfm", {
        serialNo: this.query.serialNumber,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `updateOS ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async getCredit() {
    try {
      const {
        data: { balance },
      } = await this.sendCommand("/balance/query");
      return { credit: balance.apple as number };
    } catch (error) {
      console.warn(
        `getCredit ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return { credit: 0 };
    }
  }

  async lockMacbook(phoneNumber: string, content: string, pin: string) {
    try {
      const data = await this.sendCommand("/mac/lock", {
        lostMidInfo: content,
        lostPhoneNum: phoneNumber,
        serialNo: this.query.serialNumber,
        pin,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `lockMacbook ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }

  async restartDevice() {
    try {
      const data = await this.sendCommand("/device/restart", {
        serialNo: this.query.serialNumber,
      });
      return data.code === 200;
    } catch (error) {
      console.warn(
        `restartDevice ~ serailNumber: ${this.query.serialNumber}, error: ${error}`
      );
      return false;
    }
  }
}
