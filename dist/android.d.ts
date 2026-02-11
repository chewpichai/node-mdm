import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
import { MDMDeviceDetail } from "./types";
export declare class AndroidMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidMDM>;
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
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<boolean>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    disableProxy(): Promise<boolean>;
    enableProxy(): Promise<boolean>;
    getWallpapers(): Promise<never[]>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(): Promise<any>;
    setADB(enabled: boolean): Promise<boolean>;
    setFactoryReset(enabled: boolean): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
