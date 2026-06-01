"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleMDMLockPhoneMDM = void 0;
exports.sleep = sleep;
const dayjs_1 = __importDefault(require("dayjs"));
const _1 = require(".");
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
        this.refreshKey = "appleMDMLockPhoneMDMRefreshToken";
        this.refreshToken = null;
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
            body: JSON.stringify(data),
        });
    }
    async init() {
        if (this.token)
            return;
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
        this.refreshToken = cache.get(this.refreshKey);
        if (!this.token && !this.refreshToken) {
            try {
                const response = await fetch(`${MDM_URL}/token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        appid: MDM_APPID,
                        appSecret: MDM_APPSECRET,
                    }),
                });
                const { data } = await response.json();
                this.token = data.accessToken;
                this.refreshToken = data.refreshToken;
                cache.set(this.tokenKey, data.accessToken, 50 * 60);
                cache.set(this.refreshKey, data.refreshToken, 100 * 60);
                return;
            }
            catch {
                this.token = null;
                this.refreshToken = null;
            }
        }
        if (!this.token && this.refreshToken) {
            try {
                const response = await fetch(`${MDM_URL}/refreshToken`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });
                const { data } = await response.json();
                this.token = data.accessToken;
                this.refreshToken = data.refreshToken;
                cache.set(this.tokenKey, data.accessToken, 50 * 60);
                cache.set(this.refreshKey, data.refreshToken, 100 * 60);
                return;
            }
            catch {
                this.token = null;
                this.refreshToken = null;
            }
        }
    }
    async getDeviceStatus() {
        try {
            const response = await this.sendCommand("/device/status", {
                serialNo: this.query.serialNumber,
            });
            const { data: { rentModeStatus, lostModeStatus }, } = await response.json();
            return lostModeStatus === "1"
                ? _1.DeviceStatus.LOST_LOCKED
                : rentModeStatus === "1"
                    ? _1.DeviceStatus.RENT_LOCKED
                    : _1.DeviceStatus.SUPERVISED;
        }
        catch (error) {
            console.warn(error);
            return _1.DeviceStatus.UNREGULATED;
        }
    }
    async getUSBItunesStatus() {
        try {
            const response = await this.sendCommand("/device/usb/status", {
                serialNo: this.query.serialNumber,
            });
            const { data } = await response.json();
            return data;
        }
        catch (error) {
            console.warn(error);
        }
    }
    async getHttpProxyStatus() {
        try {
            const response = await this.sendCommand("/device/http_proxy/status", {
                serialNo: this.query.serialNumber,
            });
            const { data } = await response.json();
            return data;
        }
        catch (error) {
            console.warn(error);
        }
    }
    async getDevice() {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/devicePage", {
                current: 1,
                serialNumber: this.query.serialNumber,
                contractCode: this.query.serialNumber
                    ? undefined
                    : this.query.applicationId,
                size: 10,
            });
            const body = await response.json();
            if (body.code !== 200) {
                console.log("🚀 ~ this.query:", this.query);
                console.log("🚀 ~ body:", JSON.stringify(body, null, 2));
                throw new Error("device_not_found");
            }
            const { data: { records }, } = body;
            const device = records.filter((d) => d.isdelete === 0).at(0);
            if (!device ||
                (this.query.serialNumber &&
                    this.query.serialNumber !== device.sserialno)) {
                throw new Error("device_not_found");
            }
            this.query.serialNumber = device.sserialno;
            const [functionRestrictData, deviceStatus, httpProxyStatus, usbItunesStatus,] = await Promise.all([
                this.getFunctionRestrictions(device.id),
                this.getDeviceStatus(),
                this.getHttpProxyStatus(),
                this.getUSBItunesStatus(),
            ]);
            return {
                id: device.id,
                deviceStatus,
                description: device.salesRegion ?? device.description,
                serialNumber: device.sserialno,
                activationLockStatus: device.ilockstatus,
                functionRestrictData: JSON.stringify(functionRestrictData),
                httpProxyStatus,
                phoneModel: device.smodel,
                commandContentList: [],
                deviceAssignedBy: device.deviceAssignedBy,
                color: device.color,
                createTime: (0, dayjs_1.default)(device.tcreatetime).format("YYYYMMDDHHmmss"),
                imei: device.simei,
                usbItunesStatus,
                deviceCapacity: `${device.capacity}GB`,
                osVersion: device.sosversion,
                lastOnlineTime: (0, dayjs_1.default)(device.tlastusetime).format("YYYYMMDDHHmmss"),
            };
        }
        catch (error) {
            console.warn(error);
        }
    }
    async getFunctionRestrictions(deviceId) {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/function", {
                deviceId,
            });
            const { data: { functionRestrictData }, } = await response.json();
            return Object.fromEntries(Object.entries(functionRestrictData).map(([key, value]) => {
                if (!["forceAutomaticDateAndTime", "forceWiFiPowerOn"].includes(key))
                    return [key, !value];
                return [key, value];
            }));
        }
        catch (error) {
            console.warn(error);
        }
    }
    async getEscrowKey() {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/unlock/code", {
                serialNo: this.query.serialNumber,
            });
            const { data: [code], } = await response.json();
            return code.passCode;
        }
        catch (error) {
            console.warn(error);
        }
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
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.warn(error);
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
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.warn(error);
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
        const response = await this.sendCommand("/location/data", {
            serialNo: this.query.serialNumber,
        });
        const { data } = await response.json();
        return data.map((l) => ({
            lat: Number(l.latitude),
            lng: Number(l.longitude),
        }));
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
            console.warn(error);
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
            console.warn(error);
            return false;
        }
    }
    async hideApp() {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/collectRent", {
                serialNo: this.query.serialNumber,
                type: "1",
            });
            const data = await response.json();
            console.log("hideApp:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.warn(error);
            return [false, undefined];
        }
    }
    async disableHideApp() {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/collectRent", {
                serialNo: this.query.serialNumber,
                type: "0",
            });
            const data = await response.json();
            console.log("disableHideApp:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.warn(error);
            return [false, undefined];
        }
    }
    async setPermissions(permissions) {
        if (this.query.brand !== "apple-mdmlockphone")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand("/setFunction", {
                deviceId: this.query.mdmId,
                ...permissions,
            });
            const data = await response.json();
            console.log("setPermissions:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async disableProxy() {
        try {
            const response = await this.sendCommand("/http/proxy", {
                serialNo: this.query.serialNumber,
                operationType: 0,
            });
            const data = await response.json();
            console.log("disableProxy:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async enableProxy() {
        try {
            const response = await this.sendCommand("/http/proxy", {
                serialNo: this.query.serialNumber,
                operationType: 1,
            });
            const data = await response.json();
            console.log("enableProxy:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
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
            console.warn(error);
            return false;
        }
    }
    async disableUSB() {
        try {
            const response = await this.sendCommand("/policy/usb", {
                serialNo: this.query.serialNumber,
                operationType: 0,
            });
            const data = await response.json();
            console.log("disableUSB:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async enableUSB() {
        try {
            const response = await this.sendCommand("/policy/usb", {
                serialNo: this.query.serialNumber,
                operationType: 1,
            });
            const data = await response.json();
            console.log("enableUSB:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async updateOS() {
        try {
            const response = await this.sendCommand("/apple/gdfm", {
                serialNo: this.query.serialNumber,
            });
            const data = await response.json();
            console.log("updateOS:", data);
            return data.code === 200;
        }
        catch (error) {
            console.warn(error);
            return false;
        }
    }
    async getCredit() {
        try {
            const response = await this.sendCommand("/balance/query");
            const { data: { balance }, } = await response.json();
            console.log("getCredit:", balance);
            return { credit: balance.apple };
        }
        catch (error) {
            console.warn(error);
            return { credit: 0 };
        }
    }
}
exports.AppleMDMLockPhoneMDM = AppleMDMLockPhoneMDM;
