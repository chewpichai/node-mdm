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
    serialNumber: "NPY2CKKVYD",
    brand: "apple",
  })) as AppleMDM;
  console.log(mdm);

  // Get mdmId from device.
  const device = await mdm.getDevice();
  console.log("Device", device);

  // const detail = await mdm.getDeviceDetail();
  // console.log("Detail", detail);

  const commands = await mdm.getOperationHistory();
  console.log("Commands", commands);

  // const escrowKey = await mdm.getEscrowKey();
  // console.log("Escrow Key", escrowKey);
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
    serialNumber: "LR02XJQ0MY",
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

  const escrowKey = await mdm.getEscrowKey();
  console.log("Escrow Key =", escrowKey);

  // await mdm.updateOS();
  // await mdm.setPermissions({
  //   forceAutomaticDateAndTime: false,
  //   allowFindMyDevice: false,
  //   allowAccountModification: true,
  //   allowUIConfigurationProfileInstallation: false,
  //   allowEnterpriseAppTrust: false,
  //   allowVPNCreation: false,
  //   forceWiFiPowerOn: true,
  // });

  // const locations = await mdm.getLocations();
  // console.log("Locations", locations);
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

const testAppleMDMLockPhoneMDMDevices = async () => {
  const applicationIds = [
    "60082605001078",
    "60082605000206",
    "60072604003675",
    "60082604001232",
    "60072605003072",
    "60082604001358",
    "60072605002838",
    "60082604001693",
    "60082604001108",
    "60072604009228",
    "60082605000616",
    "60082604000984",
    "60082604001791",
    "60072605002494",
    "60072604007262",
    "60072604009654",
    "60082605000081",
    "60072605003057",
    "60072605003285",
    "60072605005440",
    "60072605006599",
    "60072605002939",
    "60072604004733",
    "60072605003593",
    "60082604001105",
    "60072604004618",
    "60072604007408",
    "60072604004629",
    "60072605003189",
    "60082604001451",
  ];
  for (const applicationId of applicationIds) {
    const mdm = (await getMDM({
      applicationId,
      serialNumber: "",
      brand: "apple-mdmlockphone",
    })) as AppleMDMLockPhoneMDM;

    // Get mdmId from device.
    const device = await mdm.getDevice();
    console.log("Device", device);
  }
};

(async () => {
  // await testAppleMDM();
  // await testAndroidMDM();
  // await testAndroidSeekdreamMDM();
  // await testAppleChewLabxMDM();
  await testAppleMDMLockPhoneMDM();
  // await testAppleSeekDreamMDM();
  // await testAppleMDMLockPhoneMDMDevices();
})();
