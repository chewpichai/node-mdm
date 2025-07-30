import {
  DEVICE_STATUS,
  DeviceLocation,
  DevicePermissions,
  IMDM,
  MDMDevice,
  MDMQuery,
} from ".";
import { getClient } from "./lib/redis";
import { MDMDeviceDetail } from "./types";

const MDM_URL = process.env.MDM_ISHALOU_URL;
const MDM_USERNAME = process.env.MDM_ISHALOU_USERNAME;
const MDM_PASSWORD = process.env.MDM_ISHALOU_PASSWORD;

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AppleMDM implements IMDM {
  tokenKey: string;
  token: string | null;
  query: MDMQuery;

  static async getInstance(query: MDMQuery) {
    const instance = new AppleMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "appleMDMToken";
    this.token = null;
    this.query = query;
  }

  async sendCommand(url: string, data: Record<string, unknown>) {
    if (!this.token) throw new Error("token_not_found");

    return await fetch(`${MDM_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: this.token,
      },
      body: JSON.stringify(data),
    });
  }

  async init() {
    if (this.token) return;

    const redis = await getClient();
    this.token = await redis.get(this.tokenKey);

    if (!this.token) {
      try {
        await fetch(
          `${MDM_URL}/auth/jwt/app/login/mobileCode?type=1&mobile=${MDM_USERNAME}`
        );
        const response = await fetch(`${MDM_URL}/auth/jwt/user/mobile/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: MDM_USERNAME, code: MDM_PASSWORD }),
        });
        const { data } = await response.json();
        this.token = data;
        await redis.setEx(this.tokenKey, 60 * 60, data);
      } catch {
        this.token = "error";
      }
    }
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "apple") throw new Error("invalid_brand");
    try {
      const response = await this.sendCommand("/mdm/saas/device/queryPage", {
        possessor: this.query.serialNumber ? "" : this.query.applicationId,
        useStatusList: [],
        assignStatusList: [],
        deviceStatusList: [0, 1, 3, 4],
        lastOnlineValueList: [],
        searchContent: this.query.serialNumber ?? "",
        limit: 10,
        page: 1,
        startDateValue: "",
        endDateValue: "",
      });
      const {
        data: {
          rows: [device],
        },
      } = await response.json();

      if (device.deviceStatus === DEVICE_STATUS.UNREGULATED) {
        await this.enableSupervision();
        device.deviceStatus = DEVICE_STATUS.SUPERVISED;
      }

      return device;
    } catch {}
  }

  async getDeviceDetail(
    deviceId?: number
  ): Promise<MDMDeviceDetail | undefined> {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/deviceInfo/getByDeviceId",
        { deviceId: deviceId || this.query.mdmId }
      );
      const { data } = await response.json();
      return data;
    } catch {}
  }

  async getEscrowKey(): Promise<string | undefined> {
    try {
      const response = await this.sendCommand("/mdm/saas/device/getEscrowKey", {
        id: this.query.mdmId,
      });
      const {
        data: { escrowKey },
      } = await response.json();
      return escrowKey;
    } catch {}
  }

  async enableLostMode(phoneNumber: string, content: string) {
    try {
      const response = await this.sendCommand("/mdm/saas/device/setLose", {
        losePhone: phoneNumber,
        loseContent: content,
        id: this.query.mdmId,
      });
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async disableLostMode() {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/device/renewRegulation",
        { id: this.query.mdmId }
      );
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async refreshLocation() {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/deviceLocationNewest/deviceLocationSync",
        { deviceId: this.query.mdmId }
      );
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async getLocations() {
    const response = await this.sendCommand(
      "/mdm/saas/deviceLocationRecord/queryPage",
      { limit: 10, page: 1, deviceId: this.query.mdmId }
    );
    const {
      data: { rows },
    } = await response.json();
    return rows as DeviceLocation[];
  }

  async enableSupervision() {
    try {
      await this.sendCommand("/check/saas/mdm/order/verifyConfirm", {
        deviceList: [this.query.mdmId],
      });
      await sleep(1000);
      await this.sendCommand("/check/saas/mdm/order/payBalance", {
        deviceList: [this.query.mdmId],
      });
      await sleep(500);
      await this.setPermissions({
        forceAutomaticDateAndTime: "true",
        allowFindMyDevice: "false",
        allowUIConfigurationProfileInstallation: "true",
        allowEnterpriseAppTrust: "false",
        allowVPNCreation: "true",
        forceWiFiPowerOn: "false",
      });
      await sleep(500);
      await this.disableProxy();
    } catch (error) {
      console.log((error as Error).message);
    }
  }

  async removeMDM() {
    try {
      await this.sendCommand("/mdm/saas/device/deviceUnLock", {
        id: this.query.mdmId,
      });
      return true;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async removePassword() {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/device/setClearPasscode",
        { id: this.query.mdmId }
      );
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async hideApp() {
    try {
      const response = await this.sendCommand("/mdm/saas/device/setRent", {
        id: this.query.mdmId,
        rentIdentifierId: 1,
      });
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async setPermissions(permissions: DevicePermissions) {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/device/setFunctionRestrict",
        {
          id: this.query.mdmId,
          functionRestrictData: JSON.stringify(permissions),
        }
      );
      const { status } = await response.json();
      return status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async disableProxy() {
    try {
      const response = await this.sendCommand(
        "/mdm/saas/device/deleteHttpProxy",
        { id: this.query.mdmId }
      );
      const data = await response.json();
      console.log(data);
      return data.status === 200;
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async getWallpaper() {
    try {
      const response = await this.sendCommand("/mdm/saas/wallpager/search", {
        deviceId: this.query.mdmId,
      });
      return await response.json();
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async uploadWallpaper(wallpaper: string) {
    try {
      const response = await this.sendCommand("/mdm/saas/wallpager/save", {
        deviceId: this.query.mdmId,
        wallpager: wallpaper,
      });
      return await response.json();
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }

  async setWallpaper(changeable: boolean) {
    try {
      const response = await this.sendCommand("/mdm/saas/wallpager/change", {
        deviceId: this.query.mdmId,
        wallgerStatus: changeable,
      });
      return await response.json();
    } catch (error) {
      console.log((error as Error).message);
      return false;
    }
  }
}
