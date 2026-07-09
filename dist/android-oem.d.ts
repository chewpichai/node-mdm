import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
export declare class AndroidOEMMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidOEMMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<void>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | undefined]>;
    disableLostMode(): Promise<[
        true,
        number | undefined
    ] | [false, string | undefined]>;
    getLocations(): Promise<DeviceLocation[]>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | undefined]>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaperId?: number): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
