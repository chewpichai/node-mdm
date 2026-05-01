import dayjs from "dayjs";
import {
  DEVICE_STATUS,
  DeviceLocation,
  DevicePermissions,
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

  static async getInstance(query: MDMQuery) {
    const instance = new AppleMDMLockPhoneMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "appleMDMLockPhoneMDMToken";
    this.token = null;
    this.query = query;
  }

  async sendCommand(url: string, data?: Record<string, unknown>) {
    if (!this.token) throw new Error("token_not_found");

    return await fetch(`${MDM_URL}${url}`, {
      method: data ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async init() {
    if (this.token) return;

    const cache = getCache();
    this.token = cache.get(this.tokenKey);

    if (!this.token) {
      try {
        const response = await fetch(`${MDM_URL}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appId: MDM_APPID,
            appSecret: MDM_APPSECRET,
          }),
        });
        const { data } = await response.json();
        this.token = data.accessToken;
        cache.set(this.tokenKey, data.accessToken, 60 * 60);
      } catch {
        this.token = "error";
      }
    }
  }

  async getDeviceStatus(): Promise<
    (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS]
  > {
    try {
      const response = await this.sendCommand("/device/status", {
        serialNo: this.query.serialNumber,
      });
      const {
        data: { rentModeStatus, lostModeStatus },
      } = await response.json();
      return lostModeStatus === "1"
        ? DEVICE_STATUS.LOST_LOCKED
        : rentModeStatus === "1"
          ? DEVICE_STATUS.RENT_LOCKED
          : DEVICE_STATUS.SUPERVISED;
    } catch (error) {
      console.error(error);
      return DEVICE_STATUS.UNREGULATED;
    }
  }

  async getUSBItunesStatus() {
    try {
      const response = await this.sendCommand("/device/usb/status", {
        serialNo: this.query.serialNumber,
      });
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  async getHttpProxyStatus() {
    try {
      const response = await this.sendCommand("/device/http_proxy/status", {
        serialNo: this.query.serialNumber,
      });
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const response = await this.sendCommand("/devicePage", {
        current: 1,
        serialNumber: this.query.serialNumber,
        contractCode: this.query.applicationId,
        size: 10,
      });
      const {
        data: {
          records: [device],
        },
      } = await response.json();

      if (
        this.query.serialNumber &&
        device?.sserialno !== this.query.serialNumber
      ) {
        throw new Error("device_not_found");
      }

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
        activationLockStatus: 0,
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
      console.error(error);
    }
  }

  async getFunctionRestrictions(deviceId: number) {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const response = await this.sendCommand("/function", {
        deviceId,
      });
      const {
        data: { functionRestrictData },
      } = await response.json();
      for (const key in functionRestrictData) {
        functionRestrictData[key] = String(functionRestrictData[key]);
      }
      return functionRestrictData;
    } catch (error) {
      console.error(error);
    }
  }

  async getEscrowKey(): Promise<string | undefined> {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const response = await this.sendCommand("/unlock/code", {
        serialNo: this.query.serialNumber,
      });
      const {
        data: [code],
      } = await response.json();
      return code.passCode;
    } catch (error) {
      console.error(error);
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    try {
      const response = await this.sendCommand("/lock", {
        appid: MDM_APPID,
        isLocationNow: 1,
        lostMidInfo: content,
        lostPhoneNum: phoneNumber,
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("enableLostMode:", data);
      return [data.code === 200, data.requestId];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async disableLostMode(): Promise<[boolean, number | undefined]> {
    try {
      const response = await this.sendCommand("/unlock", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("disableLostMode:", data);
      return [data.code === 200, data.requestId];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async refreshLocation() {
    const response = await this.sendCommand("/location", {
      appid: MDM_APPID,
      serialNo: this.query.serialNumber,
    });
    const data = await response.json();
    console.log("refreshLocations:", data);
    return data.code === 200;
  }

  async getLocations(): Promise<DeviceLocation[]> {
    throw new Error("not_implemented");
  }

  async removeMDM(password: string) {
    try {
      const response = await this.sendCommand("/unbindOnce", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("removeMDM:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async removePassword() {
    try {
      const response = await this.sendCommand("/clearLock", {
        appid: MDM_APPID,
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("removePassword:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    return [false, undefined];
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const response = await this.sendCommand("/appLimit", {
        serialNo: this.query.serialNumber,
        appLimitInfoDTOList: [
          { bundleId: "com.TMBTOUCH.PRODUCTION" },
          { bundleId: "com.bangkokbank.mbanking" },
          { bundleId: "com.kasikornbank.retail.mbanking.wap" },
          { bundleId: "com.kkp.kkpmobile" },
          { bundleId: "com.krungsri.kma" },
          { bundleId: "com.ktb.netbank" },
          { bundleId: "com.ktc.tap.consumer" },
          { bundleId: "com.scb.iphone" },
          { bundleId: "com.tdcm.truemoneywallet" },
          { bundleId: "com.uob.mightyth" },
          { bundleId: "com.cimbthai.digital.mycimb" },
          { bundleId: "com.lh.lhbu" },
          { bundleId: "jp.naver.line" },
          { bundleId: "com.gsb.mobilife.MyMo" },
          { bundleId: "com.baac.amobileplus" },
        ],
        deviceId: this.query.mdmId,
        limitType: 1,
      });
      const data = await response.json();
      console.log("hideApp:", data);
      return [data.code === 200, data.requestId];
    } catch (error) {
      console.error(error);
      return [false, undefined];
    }
  }

  async setPermissions(permissions: DevicePermissions) {
    if (this.query.brand !== "apple-mdmlockphone")
      throw new Error("invalid_brand");

    try {
      const formattedPermissions = Object.fromEntries(
        Object.entries(permissions).map(([key, value]) => [
          key,
          value === "true",
        ])
      );
      const response = await this.sendCommand("/setFunction", {
        deviceId: this.query.mdmId,
        ...formattedPermissions,
      });
      const data = await response.json();
      console.log("setPermissions:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async disableProxy() {
    try {
      const response = await this.sendCommand("/http/proxy", {
        serialNo: this.query.serialNumber,
        operationType: 0,
      });
      const data = await response.json();
      console.log("disableProxy:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async enableProxy() {
    try {
      const response = await this.sendCommand("/http/proxy", {
        serialNo: this.query.serialNumber,
        operationType: 1,
      });
      const data = await response.json();
      console.log("enableProxy:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async uploadWallpaper(wallpaper: string) {
    return true;
  }

  async setWallpaper(changeable: boolean, wallpaper?: number | string) {
    try {
      const response = await this.sendCommand("/setWallpaper", {
        appid: MDM_APPID,
        paperLimit: changeable ? "0" : "1",
        paperType: "3",
        paperUrl: wallpaper,
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("setWallpaper:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async disableUSB() {
    try {
      const response = await this.sendCommand("/policy/usb", {
        serialNo: this.query.serialNumber,
        operationType: 0,
      });
      const data = await response.json();
      console.log("disableUSB:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async enableUSB() {
    try {
      const response = await this.sendCommand("/policy/usb", {
        serialNo: this.query.serialNumber,
        operationType: 1,
      });
      const data = await response.json();
      console.log("enableUSB:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async updateOS() {
    try {
      const response = await this.sendCommand("/apple/gdfm", {
        serialNo: this.query.serialNumber,
      });
      const data = await response.json();
      console.log("updateOS:", data);
      return data.code === 200;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getCredit() {
    try {
      const response = await this.sendCommand("/balance/query");
      const {
        data: { balance },
      } = await response.json();
      console.log("getCredit:", balance);
      return { credit: balance.apple as number };
    } catch (error) {
      console.error(error);
      return { credit: 0 };
    }
  }
}
