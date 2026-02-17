export const DEVICE_STATUS = {
  UNREGULATED: 0,
  SUPERVISED: 1,
  DEREGULATED: 2,
  LOST_LOCKED: 3,
  RENT_LOCKED: 4,
} as const;

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
  createTime: string;
  merchantId?: string;
  imei?: string;
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
  allowAccountModification?: "true" | "false";
};

export type MDMQuery = {
  brand: "apple" | "android" | "android-seekdream";
  mdmId?: number;
  serialNumber: string;
  applicationId: string;
  merchantId?: string;
};

export type Wallpaper = {
  id: number;
  url: string;
};

export type OperationHistory = {
  flag: number;
  id: number;
  deviceId: number;
  operation: string;
  description: string;
  deleted: number;
  creator: number;
  createTime: string;
  modifyTime: string;
  commandId: number | null;
  type: number;
  createTimeValue: number;
};

export enum DoIt {
  "notExecuted" = 0,
  "executed" = 1,
  "success" = 2,
  "failed" = 3,
  "CheckOut" = 4,
  "notSent" = 5,
  "notFullyExecuted" = 6,
  "abandoned" = 7,
}

export type Command = {
  id: number;
  uid: number;
  mid: number;
  deviceId: number;
  command:
    | "DeviceInformation"
    | "InstallProfile"
    | "RemoveProfile"
    | "Settings"
    | "ActivationLockBypassCode"
    | "ClearPasscode"
    | "EnableLostMode"
    | "DisableLostMode"
    | "DeviceLocation"
    | "ScheduleOSUpdate";
  udid: string;
  doIt: DoIt;
  creator: number;
  createTime: string;
  modifyTime: string;
  commandItem: number;
  commandName: string;
};
