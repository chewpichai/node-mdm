"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDM = void 0;
exports.sleep = sleep;
const _1 = require(".");
const cache_1 = require("./lib/cache");
const types_1 = require("./types");
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
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
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
                cache.set(this.tokenKey, data, 60 * 60);
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
            this.query.mdmId = device?.id;
            if (device?.deviceStatus === _1.DEVICE_STATUS.UNREGULATED) {
                await this.enableSupervision();
                device.deviceStatus = _1.DEVICE_STATUS.SUPERVISED;
            }
            if (device?.httpProxyStatus === 1) {
                await this.disableProxy();
                device.httpProxyStatus = 0;
            }
            return device;
        }
        catch (error) {
            console.error(error);
        }
    }
    async getDeviceDetail(deviceId) {
        if (!deviceId && !this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/deviceInfo/getByDeviceId", { deviceId: deviceId || this.query.mdmId });
            const { data } = await response.json();
            return data;
        }
        catch (error) {
            console.error(error);
        }
    }
    async getEscrowKey() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/getEscrowKey", {
                id: this.query.mdmId,
            });
            const { data: { escrowKey }, } = await response.json();
            return escrowKey;
        }
        catch (error) {
            console.error(error);
        }
    }
    async enableLostMode(phoneNumber, content) {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/setLose", {
                losePhone: phoneNumber,
                loseContent: content,
                id: this.query.mdmId,
            });
            const data = await response.json();
            console.log("enableLostMode", data);
            return [data.status === 200, data.data?.commandId];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/renewRegulation", { id: this.query.mdmId });
            const data = await response.json();
            console.log("disableLostMode", data);
            return [data.status === 200, data.data?.commandId];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async refreshLocation() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/deviceLocationNewest/deviceLocationSync", { deviceId: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async getLocations() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        const response = await this.sendCommand("/mdm/saas/deviceLocationRecord/queryPage", { limit: 10, page: 1, deviceId: this.query.mdmId });
        const { data: { rows }, } = await response.json();
        return rows;
    }
    async enableSupervision() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            await this.sendCommand("/check/saas/mdm/order/verifyConfirm", {
                deviceList: [this.query.mdmId],
            });
            await sleep(1000);
            await this.sendCommand("/check/saas/mdm/order/payBalance", {
                deviceList: [this.query.mdmId],
            });
            await sleep(3000);
            await this.setPermissions({
                allowEnterpriseAppTrust: "true",
                allowUIConfigurationProfileInstallation: "true",
                forceAutomaticDateAndTime: "true",
                forceWiFiPowerOn: "false",
                allowFindMyDevice: "true",
                allowVPNCreation: "true",
                allowAccountModification: "false",
            });
        }
        catch (error) {
            console.error(error);
        }
    }
    async removeMDM(password) {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/deviceUnLock", {
                id: this.query.mdmId,
            });
            const data = await response.json();
            console.log("🚀 ~ AppleMDM ~ removeMDM ~ data:", data);
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async removePassword() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/setClearPasscode", { id: this.query.mdmId });
            const { status } = await response.json();
            return status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async hideApp() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/setRent", {
                id: this.query.mdmId,
                rentIdentifierId: 81,
            });
            const data = await response.json();
            console.log("hideApp", data);
            return [data.status === 200, data.data?.commandId];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async setPermissions(permissions) {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/setFunctionRestrict", {
                id: this.query.mdmId,
                functionRestrictData: JSON.stringify(permissions),
            });
            const data = await response.json();
            console.log("setPermissions", data);
            return data.status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async disableProxy() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/deleteHttpProxy", { id: this.query.mdmId });
            const data = await response.json();
            console.log("disableProxy", data);
            return data.status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async enableProxy() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/device/enableHttpProxy", { id: this.query.mdmId });
            const data = await response.json();
            console.log("enableProxy", data);
            return data.status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async uploadWallpaper(wallpaper) {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/wallpager/save", {
                deviceId: this.query.mdmId,
                wallpager: wallpaper,
            });
            const data = await response.json();
            console.log("uploadWallpaper", data);
            return data.status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async setWallpaper(changeable) {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        try {
            const response = await this.sendCommand("/mdm/saas/wallpager/change", {
                deviceId: this.query.mdmId,
                wallgerStatus: changeable,
            });
            const data = await response.json();
            console.log("setWallpaper", data);
            return data.status === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async getCredit() {
        let response = await this.sendCommand("/merchant/saas/merchant/getMerchantMdmPrice", {});
        const { data: price } = await response.json();
        response = await this.sendCommand("/merchant/saas/mdmBalance/getByMerchantId", {});
        const { data: { rechargeBalance }, } = await response.json();
        return { credit: rechargeBalance / price };
    }
    async getOperationHistory() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        const response = await this.sendCommand("/mdm/saas/deviceOperationLog/getDeviceOperationLogList", { limit: 10, page: 1, deviceId: this.query.mdmId });
        const { data: { rows }, } = await response.json();
        const tasks = rows.filter((row) => row.commandId !== null);
        const commands = await Promise.all(tasks.map((task) => this.getCommand(task.commandId)));
        return commands;
    }
    async getCommand(commandId) {
        const response = await this.sendCommand("/mdm/saas/command/getCommand", {
            id: commandId,
        });
        const { status, data } = await response.json();
        if (status !== 200)
            return { id: commandId, doIt: types_1.DoIt.abandoned };
        return data;
    }
}
exports.AppleMDM = AppleMDM;
