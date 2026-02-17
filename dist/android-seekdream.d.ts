import { DeviceLocation, IMDM, MDMDevice, MDMQuery } from ".";
import { Wallpaper } from "./types";
export declare class AndroidSeekDreamMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AndroidSeekDreamMDM>;
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
    getWallpapers(): Promise<Wallpaper[]>;
    setWallpaper(changeable: boolean, wallpaperId?: number): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
    reboot(): Promise<boolean>;
    playSound(): Promise<boolean>;
}
