require("dotenv").config();
import { getMDM } from "../dist";

(async () => {
  const mdm = await getMDM({
    applicationId: "",
    serialNumber: "LY4WN2H5KK",
    brand: "apple",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
})();

(async () => {
  const mdm = await getMDM({
    applicationId: "BD0222",
    serialNumber: "",
    brand: "android",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
})();
