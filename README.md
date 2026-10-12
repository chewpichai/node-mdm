# NODE-MDM

A lightweight Node.js SDK for unified Apple, Android, and Android OEM Mobile Device Management (MDM) services, featuring in-memory caching for authentication tokens and standardized device lifecycle management.

---

## Features

- **Multi-Brand Unified Client**: Connect to multiple Apple and Android MDM platforms via a single entry point (`getMDM`).
- **Apple MDM Support**:
  - `apple` (Ishalou)
  - `apple-chewlabx` (ChewLabX)
  - `apple-mdmlockphone` (MDMLockPhone)
  - `apple-seekdream` (SeekDream)
- **Android MDM Support**:
  - `android` (Default Android MDM)
  - `android-seekdream` (SeekDream Android MDM)
- **Android OEM Direct MDM (`android-oem`)**:
  - Direct manufacturer cloud API integration for Infinix, iQOO, Oppo, Realme, Tecno, Vivo, and Xiaomi (Trustonic & MiGuard).
- **Standardized Device Models**: Consistent `MDMDevice` structure and `DeviceStatus` enum across all providers.
- **In-Memory Caching**: Automated session and token caching using `node-cache` to reduce latency and redundant authentication calls.
- **Fully Typed**: Written in TypeScript with type definitions bundled.

---

## Requirements

- Node.js >= 18.0.0

---

## Installation

```bash
# Yarn
yarn add chewpichai/node-mdm

# NPM
npm install chewpichai/node-mdm

# PNPM
pnpm add chewpichai/node-mdm
```

---

## Environment Variables

Configure the relevant environment variables according to the providers you intend to use.

### Apple MDM

| Variable | Description | Provider |
| :--- | :--- | :--- |
| `MDM_ISHALOU_URL` | Base API URL | Apple (Ishalou) |
| `MDM_ISHALOU_USERNAME` | Username / Account | Apple (Ishalou) |
| `MDM_ISHALOU_PASSWORD` | Account Password | Apple (Ishalou) |
| `MDM_CHEWLABX_URL` | Base API URL | Apple (ChewLabX) |
| `MDM_CHEWLABX_USERNAME` | Username / Account | Apple (ChewLabX) |
| `MDM_CHEWLABX_PASSWORD` | Account Password | Apple (ChewLabX) |
| `MDM_MDMLOCKPHONE_URL` | Base API URL | Apple (MDMLockPhone) |
| `MDM_MDMLOCKPHONE_APPID` | Client App ID | Apple (MDMLockPhone) |
| `MDM_MDMLOCKPHONE_APPSECRET` | Client App Secret | Apple (MDMLockPhone) |
| `MDM_SEEKDREAM_URL` | Base API URL | Apple (SeekDream) |
| `MDM_SEEKDREAM_USERNAME` | Username / Account | Apple (SeekDream) |
| `MDM_SEEKDREAM_PASSWORD` | Account Password | Apple (SeekDream) |
| `MDM_SEEKDREAM_API_KEY` | API Key | Apple (SeekDream) |
| `MDM_SEEKDREAM_ROLE` | Account Role (e.g. `agent`) | Apple (SeekDream) |

### Android MDM

| Variable | Description | Provider |
| :--- | :--- | :--- |
| `MDM_ANDROID_URL` | Base API URL | Android (Standard) |
| `MDM_ANDROID_USERNAME` | Username | Android (Standard) |
| `MDM_ANDROID_PASSWORD` | Password | Android (Standard) |
| `MDM_SEEKDREAM_URL` | Base API URL | Android (SeekDream) |
| `MDM_SEEKDREAM_USERNAME` | Username | Android (SeekDream) |
| `MDM_SEEKDREAM_PASSWORD` | Password | Android (SeekDream) |
| `MDM_SEEKDREAM_API_KEY` | API Key | Android (SeekDream) |
| `MDM_SEEKDREAM_ROLE` | Account Role (e.g. `agent`) | Android (SeekDream) |

### Android OEM Providers

| Variable | Description | OEM Brand |
| :--- | :--- | :--- |
| `INFINIX_API_KEY` | API authorization key | Infinix / Tecno |
| `OPPO_CARRIER_CODE` | Carrier code identifier | Oppo |
| `OPPO_CLIENT_SECRET` | Client secret for signature generation | Oppo |
| `OPPO_TOKEN` | Access token | Oppo |
| `REALME_CARRIER_CODE` | Carrier code identifier | Realme |
| `REALME_TOKEN` | Access token | Realme |
| `VIVO_CLIENT_ID` | VTrust Client ID | Vivo / iQOO |
| `VIVO_CLIENT_SECRET` | VTrust Client Secret | Vivo / iQOO |
| `VIVO_MANUFACTURER` | Manufacturer code | Vivo / iQOO |
| `VIVO_AES_KEY` | AES encryption key | Vivo / iQOO |
| `VIVO_AES_IV` | AES encryption IV | Vivo / iQOO |
| `XIAOMI_API_KEY` | Trustonic Cloud API key | Xiaomi (Trustonic) |
| `XIAOMI_TENANT_ID` | Trustonic Tenant ID | Xiaomi (Trustonic) |
| `MI_GUARD_APP_ID` | MiGuard App ID | Xiaomi (MiGuard) |
| `MI_GUARD_ORG_NO` | MiGuard Organization Number | Xiaomi (MiGuard) |
| `MI_GUARD_PUBLIC_KEY` | MiGuard Public Key | Xiaomi (MiGuard) |
| `MI_GUARD_PRIVATE_KEY` | MiGuard Private Key (RSA) | Xiaomi (MiGuard) |
| `MI_GUARD_MI_PUBLIC_KEY` | MiGuard Partner Public Key | Xiaomi (MiGuard) |

### Example `.env`

```env
# Apple (Ishalou)
MDM_ISHALOU_URL=https://mrsh.ishalou.com/api
MDM_ISHALOU_USERNAME=0818787004
MDM_ISHALOU_PASSWORD=secret

# Apple (ChewLabX)
MDM_CHEWLABX_URL=https://mdm.chewlabx.com/api
MDM_CHEWLABX_USERNAME=admin
MDM_CHEWLABX_PASSWORD=secret

# Apple (MDMLockPhone)
MDM_MDMLOCKPHONE_URL=https://open.mdmlockphone.com
MDM_MDMLOCKPHONE_APPID=app_id
MDM_MDMLOCKPHONE_APPSECRET=app_secret

# SeekDream (Apple & Android)
MDM_SEEKDREAM_URL=https://openapi.mdm.plus
MDM_SEEKDREAM_USERNAME=0660614826514
MDM_SEEKDREAM_PASSWORD=secret
MDM_SEEKDREAM_API_KEY=api_key
MDM_SEEKDREAM_ROLE=agent

# Android (Standard)
MDM_ANDROID_URL=http://159.65.136.63:8080
MDM_ANDROID_USERNAME=admin
MDM_ANDROID_PASSWORD=secret

# Android OEM
INFINIX_API_KEY=your_infinix_api_key

OPPO_CARRIER_CODE=your_oppo_carrier_code
OPPO_CLIENT_SECRET=your_oppo_client_secret
OPPO_TOKEN=your_oppo_token

REALME_CARRIER_CODE=your_realme_carrier_code
REALME_TOKEN=your_realme_token

VIVO_CLIENT_ID=your_vivo_client_id
VIVO_CLIENT_SECRET=your_vivo_client_secret
VIVO_MANUFACTURER=your_vivo_manufacturer
VIVO_AES_KEY=your_vivo_aes_key
VIVO_AES_IV=your_vivo_aes_iv

XIAOMI_API_KEY=your_xiaomi_api_key
XIAOMI_TENANT_ID=your_xiaomi_tenant_id

MI_GUARD_APP_ID=your_miguard_app_id
MI_GUARD_ORG_NO=your_miguard_org_no
MI_GUARD_PUBLIC_KEY=your_miguard_public_key
MI_GUARD_PRIVATE_KEY=your_miguard_private_key
MI_GUARD_MI_PUBLIC_KEY=your_miguard_mi_public_key
```

---

## Quick Usage

### 1. Apple MDM (Ishalou / MDMLockPhone / ChewLabX / SeekDream)

```ts
import { getMDM } from "node-mdm";

async function main() {
  const mdm = await getMDM({
    brand: "apple", // "apple" | "apple-chewlabx" | "apple-mdmlockphone" | "apple-seekdream"
    applicationId: "APP_12345",
    serialNumber: "DMPTD15QGXQ7",
  });

  // Fetch device details
  const device = await mdm.getDevice();
  console.log("Device status:", device?.deviceStatus);

  // Enable lost mode
  const [success, commandId] = await mdm.enableLostMode(
    "0812345678",
    "Please return this device to the owner."
  );
  console.log("Lost mode enabled:", success, commandId);

  // Disable lost mode
  await mdm.disableLostMode();
}

main();
```

### 2. Android OEM Direct Integration

```ts
import { getMDM } from "node-mdm";

async function main() {
  const mdm = await getMDM({
    brand: "android-oem",
    subBrand: "vivo", // "infinix" | "iqoo" | "oppo" | "realme" | "tecno" | "vivo" | "xiaomi"
    imei: "868831089938715",
    serialNumber: "",
    applicationId: "",
  });

  // Query device state
  const device = await mdm.getDevice();
  console.log("OEM Device:", device);

  // Lock device remotely
  await mdm.enableLostMode("0812345678", "Payment overdue. Contact support.");

  // Unlock device
  await mdm.disableLostMode();
}

main();
```

### 3. SeekDream Android MDM

```ts
import { getMDM } from "node-mdm";

async function main() {
  const mdm = await getMDM({
    brand: "android-seekdream",
    serialNumber: "RFGL1139R4Y",
    applicationId: "",
    merchantId: "merchant_01",
  });

  const device = await mdm.getDevice();
  console.log("SeekDream Device:", device);
}

main();
```

---

## API Overview

### Factory Function

```ts
getMDM(query: MDMQuery): Promise<IMDM>
```

Resolves and initializes an MDM instance based on `query.brand`.

### `MDMQuery` Parameters

```ts
type MDMQuery = {
  brand:
    | "apple"
    | "android"
    | "android-oem"
    | "android-seekdream"
    | "apple-chewlabx"
    | "apple-mdmlockphone"
    | "apple-seekdream";
  serialNumber: string;
  applicationId: string;
  mdmId?: number;
  merchantId?: string;       // Used by SeekDream
  imei?: string;             // Required for android-oem
  subBrand?: (typeof OEM_BRANDS)[number]; // "infinix" | "iqoo" | "oppo" | "realme" | "tecno" | "vivo" | "xiaomi"
  productCode?: string;      // Optional for device enrollment
};
```

---

### Unified `IMDM` Interface

All MDM client classes implement the common `IMDM` interface:

| Method | Return Type | Description |
| :--- | :--- | :--- |
| `init()` | `Promise<void>` | Initializes credentials and caches session token. |
| `getDevice()` | `Promise<MDMDevice \| undefined>` | Retrieves standardized device information and status. |
| `enableLostMode(phone, content)` | `Promise<[boolean, number \| undefined]>` | Puts the device in locked/lost mode. |
| `disableLostMode()` | `Promise<[true, number \| undefined] \| [false, string \| undefined]>` | Releases lost/lock mode. |
| `getLocations()` | `Promise<DeviceLocation[]>` | Retrieves GPS location history for the device. |
| `removeMDM(password)` | `Promise<boolean>` | Unenrolls / releases the device from MDM. |
| `removePassword()` | `Promise<boolean>` | Clears device passcode. |
| `hideApp()` | `Promise<[boolean, number \| undefined]>` | Hides client applications on the device. |
| `disableHideApp()` | `Promise<[boolean, number \| string \| undefined]>` | Restores visibility of client applications. |
| `uploadWallpaper(wallpaper)` | `Promise<boolean>` | Uploads wallpaper asset. |
| `setWallpaper(changeable, wallpaperId?)` | `Promise<boolean>` | Applies wallpaper configuration to the device. |
| `getCredit()` | `Promise<{ credit: number }>` | Retrieves account balance / credit quota. |

---

### Provider-Specific Methods

#### `AppleMDM` (Ishalou)
- `getDeviceDetail(deviceId?: number): Promise<MDMDeviceDetail>`
- `getEscrowKey(): Promise<string | undefined>`
- `enableSupervision(): Promise<void>`
- `setPermissions(permissions: DevicePermissions): Promise<void>`
- `enableProxy(): Promise<void>` / `disableProxy(): Promise<void>`
- `enableUSB(): Promise<void>` / `disableUSB(): Promise<void>`
- `updateOS(): Promise<void>`
- `getOperationHistory(): Promise<OperationHistory[]>`
- `getCommand(commandId: number): Promise<Command>`
- `clearCommand(): Promise<void>`

#### `AppleChewLabxMDM`
- `getEscrowKey(): Promise<string | undefined>`
- `refreshLocation(): Promise<void>`
- `setPermissions(permissions: DevicePermissions): Promise<void>`
- `enableUSB(): Promise<void>` / `disableUSB(): Promise<void>`
- `updateOS(): Promise<void>`

#### `AppleMDMLockPhoneMDM`
- `getDeviceStatus(): Promise<DeviceStatus>`
- `getEscrowKey(): Promise<string | undefined>`
- `getUSBItunesStatus(): Promise<0 | 1>`
- `getHttpProxyStatus(): Promise<0 | 1>`
- `getFunctionRestrictions(deviceId: number): Promise<string>`
- `refreshLocation(): Promise<void>`
- `setPermissions(permissions: DevicePermissions): Promise<void>`
- `enableProxy(): Promise<void>` / `disableProxy(): Promise<void>`
- `enableUSB(): Promise<void>` / `disableUSB(): Promise<void>`
- `updateOS(): Promise<void>`
- `lockMac(phoneNumber: string, content: string, pin: string): Promise<boolean>`
- `restartDevice(): Promise<boolean>`

#### `AppleSeekDreamMDM`
- `getEscrowKey(): Promise<string | undefined>`
- `refreshLocation(): Promise<void>`
- `setPermissions(permissions: DevicePermissions): Promise<void>`
- `enableProxy(): Promise<void>` / `disableProxy(): Promise<void>`
- `enableUSB(): Promise<void>` / `disableUSB(): Promise<void>`
- `updateOS(): Promise<void>`

#### `AndroidMDM`
- `setADB(enabled: boolean): Promise<boolean>`
- `setFactoryReset(enabled: boolean): Promise<boolean>`

#### `AndroidSeekDreamMDM`
- `getWallpapers(): Promise<Wallpaper[]>`
- `reboot(): Promise<boolean>`
- `playSound(): Promise<boolean>`

#### `AndroidOEMMDM`
- `enroll(): Promise<number>` — Registers / uploads device inventory to OEM server.
- `sendMessage(phoneNumber: string, content: string): Promise<boolean>` — Sends notification message to OEM device.

---

## Data Models

### `DeviceStatus` Enum

```ts
export enum DeviceStatus {
  unknown = "unknown",
  activating = "activating",
  active = "active",
  completing = "completing",
  completed = "completed",
  lock = "lock",
  locked = "locked",
  unlocking = "unlocking",
  unauthorized = "unauthorized",
  rent = "rent",
}
```

### `MDMDevice`

```ts
export type MDMDevice = {
  id: number;
  deviceStatus: DeviceStatus;
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
  usbItunesStatus: 0 | 1;
  deviceCapacity: string | null;
  osVersion: string | null;
  lastOnlineTime?: string;
};
```

### `DevicePermissions`

```ts
export type DevicePermissions = {
  forceAutomaticDateAndTime: boolean;
  allowFindMyDevice: boolean;
  allowAccountModification: boolean;
  allowUIConfigurationProfileInstallation: boolean;
  allowEnterpriseAppTrust: boolean;
  allowVPNCreation: boolean;
  forceWiFiPowerOn: boolean;
};
```

### Supported OEM Brands

```ts
export const OEM_BRANDS = [
  "infinix",
  "iqoo",
  "oppo",
  "realme",
  "tecno",
  "vivo",
  "xiaomi",
] as const;
```

---

## TypeScript Usage

All types and classes can be imported directly:

```ts
import {
  getMDM,
  IMDM,
  MDMQuery,
  MDMDevice,
  DeviceStatus,
  AppleMDM,
  AppleChewLabxMDM,
  AppleMDMLockPhoneMDM,
  AppleSeekDreamMDM,
  AndroidMDM,
  AndroidSeekDreamMDM,
  AndroidOEMMDM,
  OEM_BRANDS,
  logger,
} from "node-mdm";
```

Type casting when accessing provider-specific methods:

```ts
const mdm = (await getMDM({
  brand: "apple-mdmlockphone",
  applicationId: "APP_123",
  serialNumber: "G2QX5YK677",
})) as AppleMDMLockPhoneMDM;

const escrowKey = await mdm.getEscrowKey();
console.log("Escrow key:", escrowKey);
```

---

## Development

```bash
# Build TypeScript
yarn build

# Watch mode
yarn watch

# Run tests
yarn test
```

---

## License

[MIT](LICENSE)
