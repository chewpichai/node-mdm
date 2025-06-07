import { DeviceLocation, DevicePermissions, MDMDevice, MDMQuery } from "./types";
export interface IMDM {
    tokenKey: string;
    token: string | null;
    query: MDMQuery;
    sendCommand: (url: string, data: Record<string, unknown>) => Promise<Response>;
    init: () => Promise<void>;
    getDevice: (serialNumber: string) => Promise<MDMDevice | undefined>;
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
    getWallpaper: () => Promise<unknown>;
    uploadWallpaper: (wallpaper: string) => Promise<boolean>;
    setWallpaper: (changeable: boolean) => Promise<boolean>;
}
import { AndroidMDM } from "./android";
import { AppleMDM } from "./apple";
export declare function getMDM(query: MDMQuery): Promise<AppleMDM | AndroidMDM>;
