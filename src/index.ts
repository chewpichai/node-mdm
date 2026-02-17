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
  ) => Promise<[boolean, number | null]>;

  disableLostMode: () => Promise<[boolean, number | null]>;

  getLocations: () => Promise<DeviceLocation[]>;

  removeMDM: (password: string) => Promise<boolean>;

  removePassword: () => Promise<boolean>;

  hideApp: () => Promise<[boolean, number | null]>;

  setWallpaper: (changeable: boolean, wallpaperId?: number) => Promise<boolean>;

  getCredit: () => Promise<{ credit: number }>;
}

import { AndroidMDM } from "./android";
import { AndroidSeekDreamMDM } from "./android-seekdream";
import { AppleMDM } from "./apple";

const CLASSES = {
  apple: AppleMDM,
  android: AndroidMDM,
  "android-seekdream": AndroidSeekDreamMDM,
};

export async function getMDM(query: MDMQuery) {
  const clz = CLASSES[query.brand];
  return await clz.getInstance(query);
}

export { DEVICE_STATUS } from "./types";
export {
  AndroidMDM,
  AndroidSeekDreamMDM,
  AppleMDM,
  DeviceLocation,
  DevicePermissions,
  MDMDevice,
  MDMDeviceDetail,
  MDMQuery,
};
