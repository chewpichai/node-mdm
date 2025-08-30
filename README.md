# NODE-MDM

    $ yarn add chewpichai/node-mdm

A lightweight Node.js SDK to interact with internal MDM services (Ishalou + Android) with Redis-backed caching for performance and credential-based authentication helpers.

## Features

- Unified client for Ishalou and Android MDM endpoints
- Promise-based API
- Pluggable Redis cache
- Centralized auth handling
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

**MDM_ISHALOU_URL** - URL for ishalou server.

**MDM_ISHALOU_USERNAME** - Username for ishalou server.

**MDM_ISHALOU_PASSWORD** - Password for ishalou server.

**MDM_ANDROID_URL** - URL for android server.

**MDM_ANDROID_USERNAME** - Username for android server.

**MDM_ANDROID_PASSWORD** - Password for android server.

### Example .env

```env
MDM_ISHALOU_URL=https://ishalou.internal
MDM_ISHALOU_USERNAME=service_user
MDM_ISHALOU_PASSWORD=secret
MDM_ANDROID_URL=https://android.internal
MDM_ANDROID_USERNAME=service_user
MDM_ANDROID_PASSWORD=secret
```

## Configuration

Load environment variables early (dotenv or platform-specific).

```js
require("dotenv").config();
const { getMDM } = require("chewpichai/node-mdm");
// ... usage below ...
```

## Quick Usage

```js
const { getMDM } = require("chewpichai/node-mdm");

(async () => {
  const mdm = await getMDM({
    applicationId,
    serialNumber,
    brand: "apple" | "android",
  });

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
})();
```

## API Overview (Placeholder)

```text
getMDM(options: MDMQuery)
  -> returns Promise<AppleMDM | AndroidMDM>

MDMQuery
  - applicationId: string
  - serialNumber: string
  - mdmId: string | undefined
  - brand: "apple" | "android"

AppleMDM
  - getDevice()
  - getDeviceDetail()
  - getEscrowKey()
  - enableLostMode(phoneNumber: string, content: string)
  - disableLostMode()
  - refreshLocation()
  - getLocations()
  - enableSupervision()
  - removeMDM()
  - removePassword()
  - hideApp()
  - setPermissions(permissions: DevicePermissions)
  - disableProxy()
  - enableProxy()
  - getWallpaper()
  - uploadWallpaper(imageBase64: string)
  - setWallpaper(changeable: boolean)
  - getCredit()

AndroidMDM
  - getDevice()
  - enableLostMode(phoneNumber: string, content: string)
  - disableLostMode()
  - getLocations()
  - removeMDM()
  - setWallpaper(changeable: boolean)
  - setADB(enabled)
  - setFactoryReset(enabled: boolean)
```

(Adjust to actual implemented methods.)

## TypeScript

Type definitions are bundled. Import using ES Module syntax if preferred:

```ts
import { getMDM } from "chewpichai/node-mdm";
```

## Common Patterns

Batch device fetch:

```js
const ids = ["a", "b", "c"];
const results = await Promise.all(ids.map((id) => mdm.getDevice(id)));
```

## Testing (Local)

```bash
# Unit tests
yarn test
```

Use a local Redis or a test container.

## Development (Repository)

Scripts (may vary):

```bash
yarn build
yarn test
```

## Security

Report vulnerabilities privately via security advisory channel (do not open public issue).

## License

MIT (adjust if different)

## Support

Open an issue with reproduction steps and environment details.
