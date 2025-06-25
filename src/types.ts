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
};

export type MDMDeviceDetail = {
  id: number;
  imei: string;
  meid: string;
  imei2: string;
  meid2: string;
  mvno: string | null;
  mvno2: string | null;
  phoneNumber: string | null;
  phoneNumber2: string | null;
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
