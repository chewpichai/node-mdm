import { DeviceLocation, DevicePermissions, MDMDevice, MDMDeviceDetail, MDMQuery } from "./types";
export interface IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    sendCommand: (url: string, data: Record<string, unknown>) => Promise<Response>;
    init: () => Promise<void>;
    getDevice: () => Promise<MDMDevice | undefined>;
    enableLostMode: (phoneNumber: string, content: string) => Promise<[boolean, number | undefined]>;
    disableLostMode: () => Promise<[boolean, number | undefined]>;
    getLocations: () => Promise<DeviceLocation[]>;
    removeMDM: (password: string) => Promise<boolean>;
    removePassword: () => Promise<boolean>;
    hideApp: () => Promise<[boolean, number | undefined]>;
    uploadWallpaper: (wallpaper: string) => Promise<boolean>;
    setWallpaper: (changeable: boolean, wallpaperId?: number) => Promise<boolean>;
    getCredit: () => Promise<{
        credit: number;
    }>;
}
import { AndroidMDM } from "./android";
import { AndroidSeekDreamMDM } from "./android-seekdream";
import { AppleMDM } from "./apple";
export declare function getMDM(query: MDMQuery): Promise<AndroidMDM | AppleMDM | AndroidSeekDreamMDM>;
export { DEVICE_STATUS } from "./types";
export { AndroidMDM, AndroidSeekDreamMDM, AppleMDM, DeviceLocation, DevicePermissions, MDMDevice, MDMDeviceDetail, MDMQuery, };
