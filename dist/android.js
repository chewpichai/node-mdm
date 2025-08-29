"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidMDM = void 0;
const cache_1 = require("./lib/cache");
const MDM_URL = process.env.MDM_ANDROID_URL;
const MDM_USERNAME = process.env.MDM_ANDROID_USERNAME;
const MDM_PASSWORD = process.env.MDM_ANDROID_PASSWORD;
class AndroidMDM {
    static async getInstance(query) {
        const instance = new AndroidMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "androidMDMToken";
        this.token = null;
        this.query = query;
    }
    async sendCommand(url, data) {
        if (!this.token)
            throw new Error("token_not_found");
        return await fetch(`${MDM_URL}${url}`, {
            method: data ? "POST" : "GET",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${this.token}`,
            },
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    async init() {
        if (this.token)
            return;
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
        if (!this.token) {
            try {
                const response = await fetch(`${MDM_URL}/rest/public/jwt/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ login: MDM_USERNAME, password: MDM_PASSWORD }),
                });
                const { id_token: data } = await response.json();
                this.token = data;
                cache.set(this.tokenKey, data, 60 * 60);
            }
            catch {
                this.token = "error";
            }
        }
    }
    async getDevice() {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/private/devices/search", {
                groupId: -1,
                configurationId: -1,
                pageNum: 1,
                pageSize: 50,
                sortBy: null,
                sortDir: "ASC",
                value: this.query.applicationId,
            });
            const data = await response.json();
            const device = data.data.devices.items[0];
            if (!device)
                return undefined;
            return {
                id: device.id,
                deviceStatus: 1,
                description: "",
                serialNumber: device.serial,
                activationLockStatus: 1,
                functionRestrictData: "",
                httpProxyStatus: 0,
                phoneModel: "",
                commandContentList: null,
                deviceAssignedBy: "",
                color: null,
            };
        }
        catch {
            return undefined;
        }
    }
    async getDeviceDetail(deviceId) {
        return;
    }
    async getEscrowKey() {
        return;
    }
    async enableLostMode(phoneNumber, content) {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/plugins/messaging/private/send", {
                scope: "device",
                deviceNumber: this.query.applicationId,
                groupId: "",
                configurationId: "",
                message: JSON.stringify({
                    deviceId: 1,
                    lock: true,
                    type: "lock",
                    message: "-",
                }),
                messageType: "1",
            });
            const { status } = await response.json();
            return status === "OK";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async disableLostMode() {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/plugins/messaging/private/send", {
                scope: "device",
                deviceNumber: this.query.applicationId,
                groupId: "",
                configurationId: "",
                message: JSON.stringify({
                    deviceId: 1,
                    lock: false,
                    type: "lock",
                    message: "-",
                }),
                messageType: "1",
            });
            const { status } = await response.json();
            return status === "OK";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async refreshLocation() {
        return false;
    }
    async getLocations() {
        if (!this.query.mdmId)
            throw new Error("mdm_id_not_found");
        const response = await this.sendCommand(`/location/${this.query.mdmId}`);
        const { data } = await response.json();
        return [{ lat: data.lat, lng: data.lon }];
    }
    async enableSupervision() {
        return;
    }
    async removeMDM() {
        return this.setFactoryReset(false);
    }
    async removePassword() {
        return false;
    }
    async hideApp() {
        return false;
    }
    async setPermissions(permissions) {
        return false;
    }
    async disableProxy() {
        return false;
    }
    async enableProxy() {
        return false;
    }
    async getWallpaper() {
        throw new Error("method_not_implemented");
    }
    async uploadWallpaper(wallpaper) {
        return false;
    }
    async setWallpaper() {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/plugins/messaging/private/send", {
                scope: "device",
                deviceNumber: this.query.applicationId,
                groupId: "",
                configurationId: "",
                message: JSON.stringify({
                    deviceId: 1,
                    lock: false,
                    type: "wallpaper",
                    message: "-",
                }),
                messageType: "1",
            });
            return await response.json();
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async setADB(enabled) {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/plugins/messaging/private/send", {
                scope: "device",
                deviceNumber: this.query.applicationId,
                groupId: "",
                configurationId: "",
                message: JSON.stringify({
                    deviceId: 1,
                    lock: enabled,
                    type: "adb",
                    message: "-",
                }),
                messageType: "1",
            });
            return await response.json();
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async setFactoryReset(enabled) {
        if (this.query.brand !== "android")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/rest/plugins/messaging/private/send", {
                scope: "device",
                deviceNumber: this.query.applicationId,
                groupId: "",
                configurationId: "",
                message: JSON.stringify({
                    deviceId: 1,
                    lock: enabled,
                    type: "factory",
                    message: "-",
                }),
                messageType: "1",
            });
            return await response.json();
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async getCredit() {
        return { credit: 0 };
    }
}
exports.AndroidMDM = AndroidMDM;
