import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
import { MDMDeviceDetail } from "./types";
export declare function sleep(ms: number): Promise<unknown>;
export declare class AppleMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AppleMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data: Record<string, unknown>): Promise<Response>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    getDeviceDetail(deviceId?: number): Promise<MDMDeviceDetail | undefined>;
    getEscrowKey(): Promise<string | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | null]>;
    disableLostMode(): Promise<[boolean, number | null]>;
    refreshLocation(): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    enableSupervision(): Promise<void>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | null]>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    disableProxy(): Promise<boolean>;
    enableProxy(): Promise<boolean>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
    getOperationHistory(): Promise<any[]>;
    getCommand(commandId: number): Promise<any>;
}
