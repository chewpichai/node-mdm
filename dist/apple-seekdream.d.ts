import { DeviceLocation, DevicePermissions, IMDM, MDMDevice, MDMQuery } from ".";
export declare function sleep(ms: number): Promise<unknown>;
export declare class AppleSeekDreamMDM implements IMDM {
    tokenKey: string;
    token: string | null | undefined;
    query: MDMQuery;
    static getInstance(query: MDMQuery): Promise<AppleSeekDreamMDM>;
    constructor(query: MDMQuery);
    sendCommand(url: string, data?: Record<string, unknown>): Promise<Response>;
    getHashedPassword(): string;
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
    setPermissions(permissions: DevicePermissions): Promise<void>;
    disableProxy(): Promise<void>;
    enableProxy(): Promise<void>;
    uploadWallpaper(wallpaper: string): Promise<boolean>;
    setWallpaper(changeable: boolean, wallpaper?: number): Promise<boolean>;
    disableUSB(): Promise<void>;
    enableUSB(): Promise<void>;
    updateOS(): Promise<void>;
    getCredit(): Promise<{
        credit: number;
    }>;
}
