declare function getDeviceStatus(imei: string): Promise<any>;
declare function lockDevice(imei: string, phone: string, message: string): Promise<any>;
declare function unlockDevice(imei: string): Promise<any>;
declare function sendMessage(imei: string, phone: string, message: string): Promise<any>;
declare function completeDevice(imei: string): Promise<any>;
declare const _default: {
    getDeviceStatus: typeof getDeviceStatus;
    lockDevice: typeof lockDevice;
    unlockDevice: typeof unlockDevice;
    sendMessage: typeof sendMessage;
    completeDevice: typeof completeDevice;
};
export default _default;
