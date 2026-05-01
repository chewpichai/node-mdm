import { DEVICE_STATUS, DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
export declare function sleep(ms: number): Promise<unknown>;
export declare class AppleMDMLockPhoneMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AppleMDMLockPhoneMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<Response>;
    init(): Promise<void>;
    getDeviceStatus(): Promise<(typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS]>;
    getUSBItunesStatus(): Promise<any>;
    getHttpProxyStatus(): Promise<any>;
    getDevice(): Promise<MDMDevice | undefined>;
    getFunctionRestrictions(deviceId: number): Promise<any>;
    getEscrowKey(): Promise<string | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | undefined]>;
    disableLostMode(): Promise<[boolean, number | undefined]>;
    refreshLocation(): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | undefined]>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    disableProxy(): Promise<boolean>;
    enableProxy(): Promise<boolean>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaper?: number | string): Promise<boolean>;
    disableUSB(): Promise<boolean>;
    enableUSB(): Promise<boolean>;
    updateOS(): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
