import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
import infinix from "./lib/android/infinix";

export class AndroidOEMMDM implements IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;

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
    const data = await infinix.getDeviceStatus(this.query.imei!);
    console.log("🚀 ~ AndroidOEMMDM ~ init ~ data:", data);
    throw new Error("not_implemented");
  }

  async getDevice(): Promise<MDMDevice | undefined> {
    throw new Error("not_implemented");
  }

  async enableLostMode(
    phoneNumber: string,
    content: string
  ): Promise<[boolean, number | undefined]> {
    throw new Error("not_implemented");
  }

  async disableLostMode(): Promise<
    [true, number | undefined] | [false, string | undefined]
  > {
    throw new Error("not_implemented");
  }

  async getLocations(): Promise<DeviceLocation[]> {
    throw new Error("not_implemented");
  }

  async removeMDM(password: string): Promise<boolean> {
    throw new Error("not_implemented");
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
