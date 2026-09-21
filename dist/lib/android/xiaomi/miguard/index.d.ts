import { MDMAndroidOEMDevice } from "../../../../types";
/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
export declare function decompressGzip(buf: Buffer): string;
/**
 * Builds the canonical sign content string by sorting keys lexicographically
 * (ASCII order, matching Java TreeMap) and formatting as key=value&key=value.
 * Null, undefined, and empty string values are skipped.
 */
export declare function getSignContent(params: Record<string, any>): string;
declare function uploadDevice(imei: string): Promise<void>;
declare function getDevice(imei: string): Promise<MDMAndroidOEMDevice | undefined>;
declare function lockDevice(imei: string, phone: string, message: string): Promise<boolean>;
declare function unlockDevice(imei: string): Promise<boolean>;
declare function sendMessage(imei: string, phone: string, message: string): Promise<boolean>;
declare function completeDevice(imei: string): Promise<boolean>;
declare const _default: {
    uploadDevice: typeof uploadDevice;
    getDevice: typeof getDevice;
    lockDevice: typeof lockDevice;
    unlockDevice: typeof unlockDevice;
    sendMessage: typeof sendMessage;
    completeDevice: typeof completeDevice;
};
export default _default;
