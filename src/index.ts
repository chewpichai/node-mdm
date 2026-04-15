import {
  DeviceLocation,
  DevicePermissions,
  MDMDevice,
  MDMDeviceDetail,
  MDMQuery,
} from "./types";

export interface IMDM {
  tokenKey: string;
  token: string | null | undefined;
  query: MDMQuery;

  sendCommand: (
    url: string,
    data: Record<string, unknown>
  ) => Promise<Response>;

  init: () => Promise<void>;

  getDevice: () => Promise<MDMDevice | undefined>;

  enableLostMode: (
    phoneNumber: string,
    content: string
  ) => Promise<[boolean, number | undefined]>;

  disableLostMode: () => Promise<[boolean, number | undefined]>;

  getLocations: () => Promise<DeviceLocation[]>;

  removeMDM: (password: string) => Promise<boolean>;

  removePassword: () => Promise<boolean>;

  hideApp: () => Promise<[boolean, number | undefined]>;

  uploadWallpaper: (wallpaper: string) => Promise<boolean>;

  setWallpaper: (changeable: boolean, wallpaperId?: number) => Promise<boolean>;

  getCredit: () => Promise<{ credit: number }>;
}

import { AndroidMDM } from "./android";
import { AndroidSeekDreamMDM } from "./android-seekdream";
import { AppleMDM } from "./apple";
import { AppleChewLabxMDM } from "./apple-chewlabx";
import { AppleMDMLockPhoneMDM } from "./apple-mdmlockphone";

export async function getMDM(query: MDMQuery) {
  switch (query.brand) {
    case "apple-chewlabx":
      return await AppleChewLabxMDM.getInstance(query);
    case "android":
      return await AndroidMDM.getInstance(query);
    case "android-seekdream":
      return await AndroidSeekDreamMDM.getInstance(query);
    case "apple":
      return await AppleMDM.getInstance(query);
    case "apple-mdmlockphone":
      return await AppleMDMLockPhoneMDM.getInstance(query);
    default:
      throw new Error("Invalid brand");
  }
}

export { DEVICE_STATUS } from "./types";
export {
  AndroidMDM,
  AndroidSeekDreamMDM,
  AppleChewLabxMDM,
  AppleMDM,
  AppleMDMLockPhoneMDM,
  DeviceLocation,
  DevicePermissions,
  MDMDevice,
  MDMDeviceDetail,
  MDMQuery,
};
