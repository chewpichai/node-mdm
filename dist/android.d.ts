import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
export declare class AndroidMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<Response>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | undefined]>;
    disableLostMode(): Promise<[boolean, number | undefined]>;
    getLocations(): Promise<DeviceLocation[]>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | undefined]>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(): Promise<any>;
    setADB(enabled: boolean): Promise<boolean>;
    setFactoryReset(enabled: boolean): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
