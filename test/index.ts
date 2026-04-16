require("dotenv").config();
import {
  AppleChewLabxMDM,
  AppleMDM,
  AppleMDMLockPhoneMDM,
  AppleSeekDreamMDM,
  getMDM,
} from "../dist";

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
  const mdm = (await getMDM({
    applicationId: "",
    serialNumber: "DMPTD15QGXQ7",
    brand: "apple-chewlabx",
  })) as AppleChewLabxMDM;
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);
};

const testAppleMDMLockPhoneMDM = async () => {
  const mdm = (await getMDM({
    applicationId: "",
    serialNumber: "FK1ZR4QGN70V",
    brand: "apple-mdmlockphone",
  })) as AppleMDMLockPhoneMDM;
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);

  const wallpaper =
    "https://m-leasing.net/image/5fac6a08-429b-4bc3-a96e-737352ad5b4c.webp";

  // await mdm.enableLostMode("0812223333", "this is a test");
  // await mdm.disableLostMode();
  // await mdm.refreshLocation();
  // await mdm.removePassword();
  // await mdm.setWallpaper(true, wallpaper);
};

const testAppleSeekDreamMDM = async () => {
  const mdm = (await getMDM({
    applicationId: "",
    serialNumber: "JVWNY4HMXD",
    brand: "apple-seekdream",
  })) as AppleSeekDreamMDM;
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);

  // await mdm.enableLostMode("0812223333", "this is a test");
  // await mdm.disableLostMode();
  // await mdm.refreshLocation();
  // const locations = await mdm.getLocations();
  // console.log("Locations", locations);
  const credit = await mdm.getCredit();
  console.log("Credit", credit);
};

(async () => {
  // await testAppleMDM();
  // await testAndroidMDM();
  // await testAndroidSeekdreamMDM();
  // await testAppleChewLabxMDM();
  // await testAppleMDMLockPhoneMDM();
  await testAppleSeekDreamMDM();
})();
