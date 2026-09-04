export interface VTrustOpenAPIOptions {
    clientId?: string;
    clientSecret?: string;
    manufacturer?: string;
    aesIv?: string;
    aesKey?: string;
    baseUrl?: string;
}
export interface EnrollParams {
    imei: string;
    lockTime?: number | null;
    lockTimeDelayPeriod?: number;
    warnMsgAfterLocked?: string;
    remindBeforePhoneLock?: number;
    warnMsgBeforeLocked?: string;
    phoneLockRemindUrl?: string;
}
export declare enum VTrustControlType {
    LOCK = 1,
    UNLOCK = 2,
    SET_LOCK_TIME = 3
}
export interface VTrustResponse<T = any> {
    code: string;
    message: string;
    data?: T;
}
export declare class VTrustOpenAPI {
    /**
     * Generate headers for request
     */
    generateHeaders(body: string): Record<string, string>;
    /**
     * Encrypt request body with AES/GCM
     * Returns base64 string of (nonce + ciphertext + tag)
     */
    aesEncrypt(data: string): string;
    /**
     * Decrypt AES/GCM encrypted base64 string
     */
    aesDecrypt(encryptedBase64: string): string;
    private post;
    /**
     * Enroll a device in VTrust
     *
     * @param imeiOrOptions - Device imei or EnrollParams object
     * @param lockTime - Time at which device should be locked (Epoch & Unix Timestamp in ms, max: 2147483647000)
     * @param lockTimeDelayPeriod - Amount of time in minutes device will re-lock after being unlocked with pin (0 = no re-lock)
     * @param warnMsgAfterLocked - Message shown when device is locked
     * @param remindBeforePhoneLock - Minutes warning notification shown before lockTime
     * @param warnMsgBeforeLocked - Warning message before lockTime
     * @param phoneLockRemindUrl - URL in warning message before lockTime
     */
    enroll(options: EnrollParams): Promise<VTrustResponse>;
    enroll(imei: string, lockTime?: number | null, lockTimeDelayPeriod?: number, warnMsgAfterLocked?: string, remindBeforePhoneLock?: number, warnMsgBeforeLocked?: string, phoneLockRemindUrl?: string): Promise<VTrustResponse>;
    /**
     * Re-send the auth code to a device
     *
     * @param imei - Device imei
     */
    sendAuthCode(imei: string): Promise<VTrustResponse>;
    /**
     * Verify the auth code for a device
     *
     * @param imei - Device imei
     * @param authCode - Auth code shown on device
     */
    verifyAuthCode(imei: string, authCode: string): Promise<VTrustResponse>;
    /**
     * Lock/unlock/set the lockTime of a device
     *
     * @param imei - Device imei
     * @param controlType - 1: Lock instantly. 2: Unlock instantly. 3: Set lock timestamp
     * @param lockTime - Device lock timestamp to set (only needed when controlType is 3)
     */
    control(imei: string, controlType: number, lockTime?: number | null): Promise<VTrustResponse>;
    /**
     * Send a message to a device
     *
     * @param imei - Device imei
     * @param msgTitle - Title of message
     * @param msgContent - Content of message
     */
    message(imei: string, msgTitle: string, msgContent: string): Promise<VTrustResponse>;
    /**
     * Query a PIN code to unlock a device
     *
     * @param imei - Device imei
     */
    queryUnlockPin(imei: string): Promise<VTrustResponse>;
    /**
     * Query a device's state
     *
     * @param imei - Device imei
     */
    queryDeviceInfo(imei: string): Promise<VTrustResponse<{
        status: number;
    }>>;
    /**
     * Release a device from control (not reversible)
     *
     * @param imei - Device imei
     */
    completeContract(imei: string): Promise<VTrustResponse>;
    /**
     * Delete a completed or unauthorized device (not reversible)
     *
     * @param imei - Device imei
     */
    delete(imei: string): Promise<VTrustResponse>;
}
export declare function uploadDevice(imei: string): Promise<number>;
export declare function getDeviceStatus(imei: string): Promise<string>;
export declare function lockDevice(imei: string, phone: string, message: string): Promise<boolean>;
export declare function unlockDevice(imei: string): Promise<boolean>;
export declare function sendMessage(imei: string, phone: string, message: string): Promise<boolean>;
export declare function completeDevice(imei: string): Promise<boolean>;
declare const _default: {
    uploadDevice: typeof uploadDevice;
    getDeviceStatus: typeof getDeviceStatus;
    lockDevice: typeof lockDevice;
    unlockDevice: typeof unlockDevice;
    sendMessage: typeof sendMessage;
    completeDevice: typeof completeDevice;
};
export default _default;
