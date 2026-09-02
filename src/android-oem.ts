import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
import * as OEM from "./lib/android";

export class AndroidOEMMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;
  oem:
    | {
        uploadDevice: (imei: string) => Promise<number>;
        getDeviceStatus: (imei: string) => Promise<string>;
        lockDevice: (
          imei: string,
          phone: string,
          message: string
        ) => Promise<boolean>;
        unlockDevice: (imei: string) => Promise<boolean>;
        sendMessage: (
          imei: string,
          phone: string,
          message: string
        ) => Promise<boolean>;
        completeDevice: (imei: string) => Promise<boolean>;
      }
    | undefined;

  static async getInstance(query: MDMQuery) {
    const instance = new AndroidOEMMDM(query);
    await instance.init();
    return instance;
  }

  constructor(query: MDMQuery) {
    this.tokenKey = "androidOEMMDMToken";
    this.token = null;
    this.query = query;
  }

  async sendCommand(url: string, data?: Record<string, unknown>) {
    throw new Error("not_implemented");
  }

  async init() {
    if (!this.query.subBrand) throw new Error("subbrand_required");

    this.oem = OEM[this.query.subBrand];
  }

  async enroll(): Promise<number> {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    return this.oem.uploadDevice(this.query.imei);
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    throw new Error("not_implemented");
  }

  async getDeviceStatus(): Promise<string> {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    return this.oem.getDeviceStatus(this.query.imei);
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    const locked = await this.oem.lockDevice(
      this.query.imei,
      phoneNumber,
      content
    );
    return [locked, undefined];
  }

  async disableLostMode(): Promise<
    [true, number | undefined] | [false, string | undefined]
  > {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    const unlocked = await this.oem.unlockDevice(this.query.imei);
    return [unlocked, undefined];
  }

  async sendMessage(phoneNumber: string, content: string): Promise<boolean> {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    return this.oem.sendMessage(this.query.imei, phoneNumber, content);
  }

  async getLocations(): Promise<DeviceLocation[]> {
    throw new Error("not_implemented");
  }

  async removeMDM(password: string): Promise<boolean> {
    if (!this.query.imei) throw new Error("imei_required");
    if (!this.oem) throw new Error("oem_not_found");

    return this.oem.completeDevice(this.query.imei);
  }

  async removePassword(): Promise<boolean> {
    throw new Error("not_implemented");
  }

  async hideApp(): Promise<[boolean, number | undefined]> {
    return [false, undefined];
  }

  async disableHideApp(): Promise<[boolean, number | string | undefined]> {
    return [false, undefined];
  }

  async uploadWallpaper(wallpaper: string) {
    return true;
  }

  async setWallpaper(
    changeable: boolean,
    wallpaperId?: number
  ): Promise<boolean> {
    throw new Error("not_implemented");
  }

  async getCredit() {
    return { credit: 0 };
  }
}
