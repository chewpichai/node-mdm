import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
export declare class AppleChewLabxMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AppleChewLabxMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown> | FormData, method?: "GET" | "POST" | "PUT" | "DELETE"): Promise<Response>;
    init(): Promise<void>;
    getDevice(): Promise<MDMDevice | undefined>;
    getEscrowKey(): Promise<string | undefined>;
    enableLostMode(phoneNumber: string, content: string): Promise<[boolean, number | undefined]>;
    disableLostMode(): Promise<[boolean, number | undefined]>;
    refreshLocation(): Promise<boolean>;
    getLocations(): Promise<DeviceLocation[]>;
    removeMDM(password: string): Promise<boolean>;
    removePassword(): Promise<boolean>;
    hideApp(): Promise<[boolean, number | undefined]>;
    setPermissions(permissions: DevicePermissions): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaper?: number | File): Promise<boolean>;
    updateOS(): Promise<boolean>;
    clearCommand(): Promise<boolean>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
