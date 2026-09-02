import { DeviceLocation, DevicePermissions, MDMDevice, MDMDeviceDetail, MDMQuery, OEM_BRANDS } from "./types";
export interface IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    init: () => Promise<void>;
    getDevice: () => Promise<MDMDevice | undefined>;
    enableLostMode: (phoneNumber: string, content: string) => Promise<[boolean, number | undefined]>;
    disableLostMode: () => Promise<[
        true,
        number | undefined
    ] | [false, string | undefined]>;
    getLocations: () => Promise<DeviceLocation[]>;
    removeMDM: (password: string) => Promise<boolean>;
    removePassword: () => Promise<boolean>;
    hideApp: () => Promise<[boolean, number | undefined]>;
    disableHideApp: () => Promise<[boolean, number | string | undefined]>;
    uploadWallpaper: (wallpaper: string) => Promise<boolean>;
    setWallpaper: (changeable: boolean, wallpaperId?: number) => Promise<boolean>;
    getCredit: () => Promise<{
        credit: number;
    }>;
}
import { AndroidMDM } from "./android";
import { AndroidOEMMDM } from "./android-oem";
import { AndroidSeekDreamMDM } from "./android-seekdream";
import { AppleMDM } from "./apple";
import { AppleChewLabxMDM } from "./apple-chewlabx";
import { AppleMDMLockPhoneMDM } from "./apple-mdmlockphone";
import { AppleSeekDreamMDM } from "./apple-seekdream";
export declare function getMDM(query: MDMQuery): Promise<AndroidMDM | AndroidSeekDreamMDM | AppleMDM | AppleChewLabxMDM | AppleMDMLockPhoneMDM | AppleSeekDreamMDM | AndroidOEMMDM>;
export { logger } from "./lib/logger";
export { DeviceStatus, Wallpaper } from "./types";
export { AndroidMDM, AndroidOEMMDM, AndroidSeekDreamMDM, AppleChewLabxMDM, AppleMDM, AppleMDMLockPhoneMDM, AppleSeekDreamMDM, DeviceLocation, DevicePermissions, MDMDevice, MDMDeviceDetail, MDMQuery, OEM_BRANDS, };
