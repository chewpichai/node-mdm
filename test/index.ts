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
    serialNumber: "13012704B6004299",
    brand: "android-seekdream",
  });
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
};

(async () => {
  await testAppleMDM();
  // await testAndroidMDM();
  // await testAndroidSeekdreamMDM();
})();
