import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
import { MDMDeviceDetail, Wallpaper } from "./types";
export declare class AndroidSeekDreamMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidSeekDreamMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<Response>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    getDeviceDetail(deviceId?: number): Promise<MDMDeviceDetail | undefined>;
    getEscrowKey(): Promise<string | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<boolean>;
    disableLostMode(): Promise<boolean>;
    refreshLocation(): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    enableSupervision(): Promise<void>;
    removeMDM(): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<boolean>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    disableProxy(): Promise<boolean>;
    enableProxy(): Promise<boolean>;
    getWallpapers(): Promise<Wallpaper[]>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaperId?: number): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
    reboot(): Promise<boolean>;
    playSound(): Promise<boolean>;
    clearPassword(): Promise<boolean>;
}
