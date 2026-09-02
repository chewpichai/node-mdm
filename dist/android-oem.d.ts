import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
export declare class AndroidOEMMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    oem: {
        uploadDevice: (imei: string) => Promise<number>;
        getDeviceStatus: (imei: string) => Promise<string>;
        lockDevice: (imei: string, phone: string, message: string) => Promise<boolean>;
        unlockDevice: (imei: string) => Promise<boolean>;
        sendMessage: (imei: string, phone: string, message: string) => Promise<boolean>;
        completeDevice: (imei: string) => Promise<boolean>;
    } | undefined;
    static getInstance(query: MDMQuery): Promise<AndroidOEMMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<void>;
    init(): Promise<void>;
    enroll(): Promise<number>;
    getDevice(): Promise<MDMDevice | undefined>;
    getDeviceStatus(): Promise<string>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | undefined]>;
    disableLostMode(): Promise<[
        true,
        number | undefined
    ] | [false, string | undefined]>;
    sendMessage(phoneNumber: string, content: string): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | undefined]>;
    disableHideApp(): Promise<[boolean, number | string | undefined]>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaperId?: number): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
