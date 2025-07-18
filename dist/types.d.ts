export declare const DEVICE_STATUS: {
    readonly UNREGULATED: 0;
    readonly SUPERVISED: 1;
    readonly DEREGULATED: 2;
    readonly LOST_LOCKED: 3;
    readonly RENT_LOCKED: 4;
};
export type MDMDevice = {
    id: number;
    deviceStatus: (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS];
    description: string;
    serialNumber: string;
    activationLockStatus: 0 | 1;
    functionRestrictData: string;
    httpProxyStatus: 0 | 1;
    phoneModel: string;
    commandContentList: string[] | null;
    deviceAssignedBy: string;
    color: string | null;
};
export type MDMDeviceDetail = {
    id: number;
    imei: string | null;
    meid: string | null;
    imei2: string | null;
    meid2: string | null;
    mvno: string | null;
    mvno2: string | null;
    phoneNumber: string | null;
    phoneNumber2: string | null;
    deviceCapacity: string | null;
};
export type DeviceLocation = {
    deviceId: number;
    serialNumber: string;
    lng: number;
    lat: number;
};
export type DevicePermissions = {
    forceAutomaticDateAndTime: "true" | "false";
    allowFindMyDevice: "true" | "false";
    allowUIConfigurationProfileInstallation: "true" | "false";
    allowEnterpriseAppTrust: "true" | "false";
    allowVPNCreation: "true" | "false";
    forceWiFiPowerOn: "true" | "false";
};
export type MDMQuery = {
    brand: "apple" | "android";
    mdmId?: number;
    serialNumber: string;
    applicationId: string;
};
