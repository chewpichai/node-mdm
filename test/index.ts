require("dotenv").config();
import { AppleMDM, getMDM } from "../dist";

const testAppleMDM = async () => {
  const mdm = (await getMDM({
    applicationId: "",
    serialNumber: "F6WJ25D7LT",
    brand: "apple",
  })) as AppleMDM;
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);

  const commands = await mdm.getOperationHistory();
  console.log("Commands", commands);
};

const testAndroidMDM = async () => {
  const mdm = await getMDM({
    applicationId: "BD0222",
    serialNumber: "",
    brand: "android",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
};

const testAndroidSeekdreamMDM = async () => {
  const mdm = await getMDM({
    applicationId: "",
    serialNumber: "RFGL1139R4Y",
    brand: "android-seekdream",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
};

const testAppleChewLabxMDM = async () => {
  const mdm = await getMDM({
    applicationId: "",
    serialNumber: "DMPTD15QGXQ7",
    brand: "apple-chewlabx",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
};

(async () => {
  // await testAppleMDM();
  // await testAndroidMDM();
  // await testAndroidSeekdreamMDM();
  await testAppleChewLabxMDM();
})();
