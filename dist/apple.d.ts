import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
import { MDMDeviceDetail } from "./types";
export declare function sleep(ms: number): Promise<unknown>;
export declare class AppleMDM implements IMDM {
    tokenKey: string;
    token: string | null;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AppleMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data: Record<string, unknown>): Promise<Response>;
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
    getWallpaper(): Promise<any>;
    uploadWallpaper(wallpaper: string): Promise<any>;
    setWallpaper(changeable: boolean): Promise<any>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
