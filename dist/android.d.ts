import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
import { MDMDeviceDetail } from "./types";
export declare class AndroidMDM implements IMDM {
    tokenKey: string;
    token: string | null;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<Response>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    getDeviceDetail(id: number): Promise<MDMDeviceDetail | undefined>;
    getEscrowKey(): Promise<string | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<boolean>;
    disableLostMode(): Promise<boolean>;
    refreshLocation(): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    enableSupervision(): Promise<void>;
    removeMDM(): Promise<any>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<boolean>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    disableProxy(): Promise<boolean>;
    getWallpaper(): Promise<void>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(): Promise<any>;
    setADB(enabled: boolean): Promise<any>;
    setFactoryReset(enabled: boolean): Promise<any>;
}
