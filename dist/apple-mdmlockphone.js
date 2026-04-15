"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDMLockPhoneMDM = void 0;
exports.sleep = sleep;
const dayjs_1 = __importDefault(require("dayjs"));
const cache_1 = require("./lib/cache");
const MDM_URL = process.env.MDM_MDMLOCKPHONE_URL;
const MDM_APPID = process.env.MDM_MDMLOCKPHONE_APPID;
const MDM_APPSECRET = process.env.MDM_MDMLOCKPHONE_APPSECRET;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class AppleMDMLockPhoneMDM {
    static async getInstance(query) {
        const instance = new AppleMDMLockPhoneMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "appleMDMLockPhoneMDMToken";
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
                authorization: `Bearer ${this.token}`,
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
                const response = await fetch(`${MDM_URL}/token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        appId: MDM_APPID,
                        appSecret: MDM_APPSECRET,
                    }),
                });
                const { data } = await response.json();
                this.token = data.accessToken;
                cache.set(this.tokenKey, data.accessToken, 60 * 60);
            }
            catch {
                this.token = "error";
            }
        }
    }
    async getDevice() {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/devicePage", {
                current: 1,
                serialNumber: this.query.serialNumber,
                size: 10,
            });
            const { data: { records: [device], }, } = await response.json();
            if (this.query.serialNumber &&
                device?.sserialno !== this.query.serialNumber) {
                throw new Error("device_not_found");
            }
            return {
                id: device.id,
                deviceStatus: device.status,
                description: device.description,
                serialNumber: device.sserialno,
                activationLockStatus: 0,
                functionRestrictData: "",
                httpProxyStatus: 0,
                phoneModel: device.smodel,
                commandContentList: [],
                deviceAssignedBy: device.deviceAssignedBy,
                color: device.color,
                createTime: (0, dayjs_1.default)(device.tcreatetime).format("YYYYMMDDHHmmss"),
                imei: device.simei,
                usbItunesStatus: 0,
                deviceCapacity: `${device.capacity}GB`,
                osVersion: device.sosversion,
                lastOnlineTime: (0, dayjs_1.default)(device.tlastusetime).format("YYYYMMDDHHmmss"),
            };
        }
        catch (error) {
            console.error(error);
        }
    }
    async getEscrowKey() {
        throw new Error("not_implemented");
    }
    async enableLostMode(phoneNumber, content) {
        try {
            const response = await this.sendCommand("/lock", {
                appid: MDM_APPID,
                isLocationNow: 1,
                lostMidInfo: content,
                lostPhoneNum: phoneNumber,
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("enableLostMode:", data);
            return [data.code === 200, data.requestId];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        try {
            const response = await this.sendCommand("/unlock", {
                appid: MDM_APPID,
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("disableLostMode:", data);
            return [data.code === 200, data.requestId];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async refreshLocation() {
        const response = await this.sendCommand("/location", {
            appid: MDM_APPID,
            serialNo: this.query.serialNumber,
        });
        const data = await response.json();
        console.log("refreshLocations:", data);
        return data.code === 200;
    }
    async getLocations() {
        throw new Error("not_implemented");
    }
    async removeMDM(password) {
        try {
            const response = await this.sendCommand("/unbindOnce", {
                appid: MDM_APPID,
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("removeMDM:", data);
            return data.code === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async removePassword() {
        try {
            const response = await this.sendCommand("/clearLock", {
                appid: MDM_APPID,
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("removePassword:", data);
            return data.code === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async hideApp() {
        throw new Error("not_implemented");
    }
    async setPermissions(permissions) {
        throw new Error("not_implemented");
    }
    async disableProxy() {
        throw new Error("not_implemented");
    }
    async enableProxy() {
        throw new Error("not_implemented");
    }
    async uploadWallpaper(wallpaper) {
        return true;
    }
    async setWallpaper(changeable, wallpaper) {
        try {
            const response = await this.sendCommand("/setWallpaper", {
                appid: MDM_APPID,
                paperLimit: changeable ? "0" : "1",
                paperType: "3",
                paperUrl: wallpaper,
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("setWallpaper:", data);
            return data.code === 200;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async disableUSB() {
        throw new Error("not_implemented");
    }
    async enableUSB() {
        throw new Error("not_implemented");
    }
    async updateOS() {
        throw new Error("not_implemented");
    }
    async getCredit() {
        return { credit: 0 };
    }
}
exports.AppleMDMLockPhoneMDM = AppleMDMLockPhoneMDM;
