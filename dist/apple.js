"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDM = void 0;
exports.sleep = sleep;
const _1 = require(".");
const redis_1 = require("./lib/redis");
const MDM_URL = process.env.MDM_ISHALOU_URL;
const MDM_USERNAME = process.env.MDM_ISHALOU_USERNAME;
const MDM_PASSWORD = process.env.MDM_ISHALOU_PASSWORD;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class AppleMDM {
    static async getInstance(query) {
        const instance = new AppleMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "appleMDMToken";
        this.token = null;
        this.query = query;
    }
    async sendCommand(url, data) {
        if (!this.token)
            throw new Error("token_not_found");
        return await fetch(`${MDM_URL}${url}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: this.token,
            },
            body: JSON.stringify(data),
        });
    }
    async init() {
        if (this.token)
            return;
        const redis = await (0, redis_1.getClient)();
        this.token = await redis.get(this.tokenKey);
        if (!this.token) {
            try {
                await fetch(`${MDM_URL}/auth/jwt/app/login/mobileCode?type=1&mobile=${MDM_USERNAME}`);
                const response = await fetch(`${MDM_URL}/auth/jwt/user/mobile/token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mobile: MDM_USERNAME, code: MDM_PASSWORD }),
                });
                const { data } = await response.json();
                this.token = data;
                await redis.setEx(this.tokenKey, 60 * 60, data);
            }
            catch {
                this.token = "error";
            }
        }
    }
    async getDevice() {
        if (this.query.brand !== "apple")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/mdm/saas/device/queryPage", {
                possessor: this.query.serialNumber ? "" : this.query.applicationId,
                useStatusList: [],
                assignStatusList: [],
                deviceStatusList: [0, 1, 3, 4],
                lastOnlineValueList: [],
                searchContent: this.query.serialNumber ?? "",
                limit: 10,
                page: 1,
                startDateValue: "",
                endDateValue: "",
            });
            const { data: { rows: [device], }, } = await response.json();
            if (device.deviceStatus === _1.DEVICE_STATUS.UNREGULATED) {
                await this.enableSupervision();
                device.deviceStatus = _1.DEVICE_STATUS.SUPERVISED;
            }
            return device;
        }
        catch { }
    }
    async getDeviceDetail(id) {
        try {
            const response = await this.sendCommand("/mdm/saas/deviceInfo/getByDeviceId", { deviceId: id });
            const { data } = await response.json();
            return data;
        }
        catch { }
    }
    async getEscrowKey() {
        try {
            const response = await this.sendCommand("/mdm/saas/device/getEscrowKey", {
                id: this.query.mdmId,
            });
            const { data: { escrowKey }, } = await response.json();
            return escrowKey;
        }
        catch { }
    }
    async enableLostMode(phoneNumber, content) {
        try {
            const response = await this.sendCommand("/mdm/saas/device/setLose", {
                losePhone: phoneNumber,
                loseContent: content,
                id: this.query.mdmId,
            });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async disableLostMode() {
        try {
            const response = await this.sendCommand("/mdm/saas/device/renewRegulation", { id: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async refreshLocation() {
        try {
            const response = await this.sendCommand("/mdm/saas/deviceLocationNewest/deviceLocationSync", { deviceId: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async getLocations() {
        const response = await this.sendCommand("/mdm/saas/deviceLocationRecord/queryPage", { limit: 10, page: 1, deviceId: this.query.mdmId });
        const { data: { rows }, } = await response.json();
        return rows;
    }
    async enableSupervision() {
        try {
            await this.sendCommand("/check/saas/mdm/order/verifyConfirm", {
                deviceList: [this.query.mdmId],
            });
            await sleep(1000);
            await this.sendCommand("/check/saas/mdm/order/payBalance", {
                deviceList: [this.query.mdmId],
            });
            await sleep(500);
            await this.setPermissions({
                forceAutomaticDateAndTime: "true",
                allowFindMyDevice: "false",
                allowUIConfigurationProfileInstallation: "true",
                allowEnterpriseAppTrust: "false",
                allowVPNCreation: "true",
                forceWiFiPowerOn: "false",
            });
            await sleep(500);
            await this.disableProxy();
        }
        catch (error) {
            console.log(error.message);
        }
    }
    async removeMDM() {
        try {
            await this.sendCommand("/mdm/saas/device/deviceUnLock", {
                id: this.query.mdmId,
            });
            return true;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async removePassword() {
        try {
            const response = await this.sendCommand("/mdm/saas/device/setClearPasscode", { id: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async hideApp() {
        try {
            const response = await this.sendCommand("/mdm/saas/device/setRent", {
                id: this.query.mdmId,
                rentIdentifierId: 1,
            });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async setPermissions(permissions) {
        try {
            const response = await this.sendCommand("/mdm/saas/device/setFunctionRestrict", {
                id: this.query.mdmId,
                functionRestrictData: JSON.stringify(permissions),
            });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async disableProxy() {
        try {
            const response = await this.sendCommand("/mdm/saas/device/deleteHttpProxy", { id: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async getWallpaper() {
        try {
            const response = await this.sendCommand("/mdm/saas/wallpager/search", {
                deviceId: this.query.mdmId,
            });
            return await response.json();
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async uploadWallpaper(wallpaper) {
        try {
            const response = await this.sendCommand("/mdm/saas/wallpager/save", {
                deviceId: this.query.mdmId,
                wallpager: wallpaper,
            });
            return await response.json();
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
    async setWallpaper(changeable) {
        try {
            const response = await this.sendCommand("/mdm/saas/wallpager/change", {
                deviceId: this.query.mdmId,
                wallgerStatus: changeable,
            });
            return await response.json();
        }
        catch (error) {
            console.log(error.message);
            return false;
        }
    }
}
exports.AppleMDM = AppleMDM;
