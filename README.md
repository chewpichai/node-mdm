# NODE-MDM

A lightweight Node.js SDK to interact with internal MDM services (Ishalou, Android, and Android-SeekDream) with in-memory caching for performance and credential-based authentication helpers.

## Features

- Unified client for Ishalou (Apple), Android, and Android-SeekDream MDM endpoints
- Promise-based API
- Centralized auth handling with `node-cache`
- Typed responses (if using TypeScript consumers)
- Minimal external dependencies

## Requirements

- Node.js >= 16

## Installation

```bash
# Yarn
yarn add chewpichai/node-mdm
# NPM
npm install chewpichai/node-mdm
# PNPM
pnpm add chewpichai/node-mdm
```

## Environment Variables

**MDM_ISHALOU_URL** - URL for Ishalou server (Apple).
**MDM_ISHALOU_USERNAME** - Username for Ishalou server.
**MDM_ISHALOU_PASSWORD** - Password for Ishalou server.

**MDM_ANDROID_URL** - URL for Android server.
**MDM_ANDROID_USERNAME** - Username for Android server.
**MDM_ANDROID_PASSWORD** - Password for Android server.

**MDM_SEEKDREAM_URL** - URL for Android-SeekDream server.
**MDM_SEEKDREAM_USERNAME** - Username for Android-SeekDream server.
**MDM_SEEKDREAM_PASSWORD** - Password for Android-SeekDream server.
**MDM_SEEKDREAM_API_KEY** - API Key for Android-SeekDream server.
**MDM_SEEKDREAM_SECOND_PASSWORD** - (Optional) Second password for certain operations.

### Example .env

```env
MDM_ISHALOU_URL=https://mrsh.ishalou.com/api
MDM_ISHALOU_USERNAME=18878756004
MDM_ISHALOU_PASSWORD=123456

MDM_ANDROID_URL=http://159.65.136.63:8080
MDM_ANDROID_USERNAME=admin
MDM_ANDROID_PASSWORD=secret

MDM_SEEKDREAM_URL=https://openapi.mdm.plus
MDM_SEEKDREAM_USERNAME=0660614826514
MDM_SEEKDREAM_PASSWORD=secret
MDM_SEEKDREAM_API_KEY=5eb1567ad0a72b05a38d55151d43182970
MDM_SEEKDREAM_SECOND_PASSWORD=optional_second_secret
```

## Quick Usage

```js
const { getMDM } = require("node-mdm");

(async () => {
  const mdm = await getMDM({
    applicationId: "app_id_123",
    serialNumber: "SN_123",
    brand: "apple", // "apple" | "android" | "android-seekdream"
    // merchantId: "merchant_id", // For android-seekdream
  });

  // Get device from MDM.
  const device = await mdm.getDevice();
  console.log("Device", device);
})();
```

## API Overview

```text
getMDM(options: MDMQuery)
  -> returns Promise<AppleMDM | AndroidMDM | AndroidSeekDreamMDM>

MDMQuery
  - applicationId: string
  - serialNumber: string
  - mdmId?: number
  - merchantId?: string (Required for android-seekdream)
  - brand: "apple" | "android" | "android-seekdream"

AppleMDM
  - getDevice()
  - getDeviceDetail(deviceId?: number)
  - getEscrowKey()
  - enableLostMode(phoneNumber: string, content: string)
  - disableLostMode()
  - refreshLocation()
  - getLocations()
  - enableSupervision()
  - removeMDM(password: string)
  - removePassword()
  - hideApp()
  - setPermissions(permissions: DevicePermissions)
  - disableProxy()
  - enableProxy()
  - uploadWallpaper(wallpaper: string)
  - setWallpaper(changeable: boolean)
  - getCredit()
  - getOperationHistory()
  - getCommand(commandId: number)
  - disableUSB()
  - enableUSB()
  - updateOS()
  - clearCommand()

AndroidMDM
  - getDevice()
  - enableLostMode(phoneNumber: string, content: string)
  - disableLostMode()
  - getLocations()
  - removeMDM(password: string)
  - removePassword()
  - hideApp()
  - uploadWallpaper(wallpaper: string)
  - setWallpaper()
  - setADB(enabled: boolean)
  - setFactoryReset(enabled: boolean)
  - getCredit()

AndroidSeekDreamMDM
  - getDevice()
  - enableLostMode(phoneNumber: string, content: string)
  - disableLostMode()
  - getLocations()
  - removeMDM(password: string)
  - removePassword()
  - hideApp()
  - uploadWallpaper(wallpaper: string)
  - getWallpapers()
  - setWallpaper(changeable: boolean, wallpaperId?: number)
  - getCredit()
  - reboot()
  - playSound()
```

## TypeScript

Type definitions are bundled. Import using ES Module syntax:

```ts
import { getMDM, MDMQuery, IMDM } from "node-mdm";

const query: MDMQuery = {
  applicationId: "a1",
  serialNumber: "SN1",
  brand: "apple",
};

const mdm: IMDM = await getMDM(query);
```

## Common Patterns

Batch device fetch:

```js
const ids = ["apple", "android", "android-seekdream"];
const queries = ids.map((brand) => ({
  applicationId: "a1",
  serialNumber: "s1",
  brand,
}));
const results = await Promise.all(
  queries.map((q) => getMDM(q).then((mdm) => mdm.getDevice()))
);
```

## Testing (Local)

```bash
# Unit tests
yarn test
```

## Development (Repository)

Scripts (may vary):

```bash
yarn build
yarn test
```

## Security

Report vulnerabilities privately via security advisory channel (do not open public issue).

## License

MIT

## Support

Open an issue with reproduction steps and environment details.
