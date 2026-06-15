import {
  DeviceLocation,
  DevicePermissions,
  DeviceStatus,
  IMDM,
  MDMDevice,
  MDMQuery,
} from ".";
import { getCache } from "./lib/cache";
import { Command, DoIt, MDMDeviceDetail, OperationHistory } from "./types";

const MDM_URL = process.env.MDM_ISHALOU_URL;
const MDM_USERNAME = process.env.MDM_ISHALOU_USERNAME;
const MDM_PASSWORD = process.env.MDM_ISHALOU_PASSWORD;
const ERRORS: Record<string, string> = {
  "已存在未执行的相关指令,请勿重复操作": "existing_command_error",
  设备状态错误: "device_status_error",
};

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AppleMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
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

  async sendCommand(url: string, body: Record<string, unknown>) {
    if (!this.token) throw new Error("token_not_found");

    const response = await fetch(`${MDM_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: this.token,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("network_error");

    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (data.status !== 200)
        console.log("🚀 ~ AppleMDM ~ sendCommand ~ data:", data);

      return data;
    } catch (error) {
      console.warn("🚀 ~ AppleMDM ~ sendCommand ~ text:", text);
      throw error;
    }
  }

  async init() {
    if (this.token) return;

    const cache = getCache();
    this.token = cache.get(this.tokenKey);

    if (!this.token) {
      try {
        const response = await fetch(`${MDM_URL}/auth/jwt/user/pwd/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: MDM_USERNAME,
            password: MDM_PASSWORD,
          }),
        });
        const { data } = await response.json();
        this.token = data;
        cache.set(this.tokenKey, data, 60 * 60);
      } catch {
        this.token = "error";
      }
    }
  }

  async _getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "apple") throw new Error("invalid_brand");

    try {
      const {
        data: {
          rows: [device],
        },
      } = await this.sendCommand("/mdm/saas/device/queryPage", {
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

      if (
        !device ||
        (this.query.serialNumber &&
          this.query.serialNumber !== device?.serialNumber)
      ) {
        console.log(this.query.serialNumber, device.sserialno);
        throw new Error("device_not_found");
      }

      return device;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
    }
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    if (this.query.brand !== "apple") throw new Error("invalid_brand");
    try {
      const device = await this._getDevice();
      this.query.mdmId = device?.id;

      if (device?.deviceStatus === DeviceStatus.UNREGULATED) {
        await this.enableSupervision();
        const _device = await this._getDevice();
        if (!_device) throw new Error("device_not_found");
        device.deviceStatus = _device?.deviceStatus;
      }

      if (!device) throw new Error("device_not_found");

      if (device.httpProxyStatus === 1) {
        await this.disableProxy();
        device.httpProxyStatus = 0;
      }

      device.functionRestrictData = JSON.stringify(
        Object.fromEntries(
          Object.entries(JSON.parse(device.functionRestrictData)).map(
            ([key, value]) => [key, value === "true"]
          )
        )
      );
      return device;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
    }
  }

  async getDeviceDetail(
    deviceId?: number
  ): Promise<MDMDeviceDetail | undefined> {
    if (!deviceId && !this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const { data } = await this.sendCommand(
        "/mdm/saas/deviceInfo/getByDeviceId",
        { deviceId: deviceId || this.query.mdmId }
      );
      return data;
    } catch (error) {
      console.warn(error);
    }
  }

  async getEscrowKey(): Promise<string | undefined> {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const {
        data: { escrowKey },
      } = await this.sendCommand("/mdm/saas/device/getEscrowKey", {
        id: this.query.mdmId,
      });
      return escrowKey;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
    }
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/setLose", {
        losePhone: phoneNumber,
        loseContent: content,
        id: this.query.mdmId,
      });
      return [data.status === 200, data.data?.commandId];
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return [false, undefined];
    }
  }

  async disableLostMode(): Promise<
    [true, number | undefined] | [false, string | undefined]
  > {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/renewRegulation", {
        id: this.query.mdmId,
      });
      if (data.status !== 200)
        throw new Error(ERRORS[data.message] || data.message);
      return [true, data.data.commandId];
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return [false, (error as Error).message];
    }
  }

  async refreshLocation() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand(
        "/mdm/saas/deviceLocationNewest/deviceLocationSync",
        { deviceId: this.query.mdmId }
      );
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async getLocations() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    const {
      data: { rows },
    } = await this.sendCommand("/mdm/saas/deviceLocationRecord/queryPage", {
      limit: 10,
      page: 1,
      deviceId: this.query.mdmId,
    });
    return rows as DeviceLocation[];
  }

  async enableSupervision() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      await this.sendCommand("/check/saas/mdm/order/verifyConfirm", {
        deviceList: [this.query.mdmId],
      });
      await sleep(1000);
      await this.sendCommand("/check/saas/mdm/order/payBalance", {
        deviceList: [this.query.mdmId],
      });
      await sleep(3000);
      await this.setPermissions({
        forceAutomaticDateAndTime: true,
        allowFindMyDevice: false,
        allowAccountModification: true,
        allowUIConfigurationProfileInstallation: false,
        allowEnterpriseAppTrust: false,
        allowVPNCreation: false,
        forceWiFiPowerOn: false,
      });
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
    }
  }

  async removeMDM(password: string) {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/deviceUnLock", {
        id: this.query.mdmId,
      });
      return [11001009, 200].includes(data.status);
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async removePassword() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/setClearPasscode", {
        id: this.query.mdmId,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/setRent", {
        id: this.query.mdmId,
        rentIdentifierId: 81,
      });
      return [data.status === 200, data.data?.commandId];
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return [false, undefined];
    }
  }

  async setPermissions(permissions: DevicePermissions) {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const formattedPermissions = Object.fromEntries(
        Object.entries(permissions).map(([key, value]) => {
          if (["forceAutomaticDateAndTime", "forceWiFiPowerOn"].includes(key))
            return [key, value ? "true" : "false"];
          return [key, value ? "false" : "true"];
        })
      );
      const data = await this.sendCommand(
        "/mdm/saas/device/setFunctionRestrict",
        {
          id: this.query.mdmId,
          functionRestrictData: JSON.stringify(formattedPermissions),
        }
      );
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async disableProxy() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/deleteHttpProxy", {
        id: this.query.mdmId,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async enableProxy() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/enableHttpProxy", {
        id: this.query.mdmId,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async uploadWallpaper(wallpaper: string) {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/wallpager/save", {
        deviceId: this.query.mdmId,
        wallpager: wallpaper,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async setWallpaper(changeable: boolean) {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/wallpager/change", {
        deviceId: this.query.mdmId,
        wallgerStatus: changeable,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async getCredit() {
    let { data: price } = await this.sendCommand(
      "/merchant/saas/merchant/getMerchantMdmPrice",
      {}
    );
    const {
      data: { rechargeBalance },
    } = await this.sendCommand("/merchant/saas/mdmBalance/getByMerchantId", {});
    return { credit: rechargeBalance / price };
  }

  async getOperationHistory() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    const {
      data: { rows },
    } = await this.sendCommand(
      "/mdm/saas/deviceOperationLog/getDeviceOperationLogList",
      { limit: 10, page: 1, deviceId: this.query.mdmId }
    );
    const tasks = rows.filter(
      (row: OperationHistory) => row.commandId !== null
    );
    const commands = await Promise.all<OperationHistory>(
      tasks.map((task: { commandId: number }) =>
        this.getCommand(task.commandId)
      )
    );
    return commands;
  }

  async getCommand(commandId: number) {
    const { status, data } = await this.sendCommand(
      "/mdm/saas/command/getCommand",
      { id: commandId }
    );

    if (status !== 200)
      return { id: commandId, doIt: DoIt.abandoned } as Command;

    return data as Command;
  }

  async disableUSB() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand(
        "/mdm/saas/device/setUsbItunesStatus",
        {
          id: this.query.mdmId,
          usbItunesStatus: 1,
        }
      );
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async enableUSB() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand(
        "/mdm/saas/device/setUsbItunesStatus",
        {
          id: this.query.mdmId,
          usbItunesStatus: 0,
        }
      );
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async updateOS() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const data = await this.sendCommand("/mdm/saas/device/scheduleOSUpdate", {
        id: this.query.mdmId,
      });
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }

  async clearCommand() {
    if (!this.query.mdmId) throw new Error("mdm_id_not_found");

    try {
      const device = await this.getDevice();

      if (!device) return false;

      const data = await fetch(
        `https://mrsh.ishalou.net/api/mdm/admin/device/deleteCmd?serialNumber=${device.serialNumber}`
      );
      return data.status === 200;
    } catch (error) {
      console.warn(`serailNumber: ${this.query.serialNumber}, error: ${error}`);
      return false;
    }
  }
}
