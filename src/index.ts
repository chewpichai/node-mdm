import {
  DeviceLocation,
  DevicePermissions,
  MDMDevice,
  MDMDeviceDetail,
  MDMQuery,
  Wallpaper,
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

  getDeviceDetail: (deviceId?: number) => Promise<MDMDeviceDetail | undefined>;

  getEscrowKey: () => Promise<string | undefined>;

  enableLostMode: (phoneNumber: string, content: string) => Promise<boolean>;

  disableLostMode: () => Promise<boolean>;

  refreshLocation: () => Promise<boolean>;

  getLocations: () => Promise<DeviceLocation[]>;

  enableSupervision: () => Promise<void>;

  removeMDM: () => Promise<boolean>;

  removePassword: () => Promise<boolean>;

  hideApp: () => Promise<boolean>;

  setPermissions: (permissions: DevicePermissions) => Promise<boolean>;

  disableProxy: () => Promise<boolean>;

  enableProxy: () => Promise<boolean>;

  getWallpapers: () => Promise<Wallpaper[]>;

  uploadWallpaper: (wallpaper: string) => Promise<boolean>;

  setWallpaper: (changeable: boolean) => Promise<boolean>;

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
