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
import { AppleChewLabxMDM } from "./apple-chewlabx";
import { AppleMDMLockPhoneMDM } from "./apple-mdmlockphone";
import { AppleSeekDreamMDM } from "./apple-seekdream";
export declare function getMDM(query: MDMQuery): Promise<AndroidMDM | AppleMDM | AppleChewLabxMDM | AppleMDMLockPhoneMDM | AppleSeekDreamMDM | AndroidSeekDreamMDM>;
export { DEVICE_STATUS, Wallpaper } from "./types";
export { AndroidMDM, AndroidSeekDreamMDM, AppleChewLabxMDM, AppleMDM, AppleMDMLockPhoneMDM, AppleSeekDreamMDM, DeviceLocation, DevicePermissions, MDMDevice, MDMDeviceDetail, MDMQuery, };
