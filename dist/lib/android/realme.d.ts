declare function uploadDevice(imei: string): Promise<number>;
declare function getDeviceStatus(imei: string): Promise<string>;
declare function lockDevice(imei: string, phone: string, message: string): Promise<boolean>;
declare function unlockDevice(imei: string): Promise<boolean>;
declare function sendMessage(imei: string, phone: string, message: string): Promise<boolean>;
declare function completeDevice(imei: string): Promise<boolean>;
declare const _default: {
    uploadDevice: typeof uploadDevice;
    getDeviceStatus: typeof getDeviceStatus;
    lockDevice: typeof lockDevice;
    unlockDevice: typeof unlockDevice;
    sendMessage: typeof sendMessage;
    completeDevice: typeof completeDevice;
};
export default _default;
