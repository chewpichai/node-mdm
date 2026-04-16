"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleSeekDreamMDM = void 0;
exports.sleep = sleep;
const crypto_1 = __importDefault(require("crypto"));
const dayjs_1 = __importDefault(require("dayjs"));
const cache_1 = require("./lib/cache");
const MDM_URL = process.env.MDM_SEEKDREAM_URL;
const MDM_USERNAME = process.env.MDM_SEEKDREAM_USERNAME;
const MDM_PASSWORD = process.env.MDM_SEEKDREAM_PASSWORD;
const MDM_API_KEY = process.env.MDM_SEEKDREAM_API_KEY;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class AppleSeekDreamMDM {
    static async getInstance(query) {
        const instance = new AppleSeekDreamMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "appleSeekDreamMDMToken";
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
                "X-API-Key": MDM_API_KEY,
                token: this.token,
            },
            body: data ? JSON.stringify(data) : undefined,
        });
    }
    getHashedPassword() {
        const hash = crypto_1.default.createHash("md5").update(MDM_PASSWORD).digest("hex");
        return crypto_1.default.createHash("md5").update(hash.slice(7, -7)).digest("hex");
    }
    async init() {
        if (this.token)
            return;
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
        if (!this.token) {
            try {
                const response = await fetch(`${MDM_URL}/user/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": MDM_API_KEY,
                    },
                    body: JSON.stringify({
                        role: "agent",
                        username: MDM_USERNAME,
                        password: this.getHashedPassword(),
                    }),
                });
                const { token } = await response.json();
                this.token = token;
                cache.set(this.tokenKey, token, 60 * 60);
            }
            catch {
                this.token = "error";
            }
        }
    }
    async getDevice() {
        if (this.query.brand !== "apple-seekdream")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand(`/device/info?serial=${this.query.serialNumber}`);
            const { data: { detail: device }, } = await response.json();
            if (this.query.serialNumber &&
                device?.serial !== this.query.serialNumber) {
                throw new Error("device_not_found");
            }
            const [imei] = device.IMEI.split(",");
            return {
                id: device.id,
                deviceStatus: 0,
                description: device.device_description,
                serialNumber: device.serial,
                activationLockStatus: 0,
                functionRestrictData: "",
                httpProxyStatus: 0,
                phoneModel: "",
                commandContentList: [],
                deviceAssignedBy: device.dcInfo.detail.assign_by,
                color: device.dcInfo.detail.color,
                createTime: (0, dayjs_1.default)(device.add_time).format("YYYYMMDDHHmmss"),
                imei,
                usbItunesStatus: 0,
                deviceCapacity: "",
                osVersion: device.OSVersion,
                lastOnlineTime: (0, dayjs_1.default)(device.last_time).format("YYYYMMDDHHmmss"),
                merchantId: device.merchant_id,
            };
        }
        catch (error) {
            console.error(error);
        }
    }
    async getEscrowKey() {
        if (this.query.brand !== "apple-seekdream")
            throw new Error("invalid_brand");
        try {
            const params = new URLSearchParams({
                serial: this.query.serialNumber,
                secondPassword: this.getHashedPassword(),
            });
            const response = await this.sendCommand(`/device/activateLock?${params.toString()}`);
            const data = await response.json();
            console.log("getEscrowKey:", data);
            return "";
        }
        catch (error) {
            console.error(error);
        }
    }
    async enableLostMode(phoneNumber, content) {
        try {
            const response = await this.sendCommand(`/device/lock?serial=${this.query.serialNumber}`, {
                phone: phoneNumber,
                content: content,
                footer: "",
                location: true,
            });
            const data = await response.json();
            console.log("enableLostMode:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        try {
            const response = await this.sendCommand(`/device/unlock?serial=${this.query.serialNumber}`, {});
            const data = await response.json();
            console.log("disableLostMode:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async refreshLocation() {
        const response = await this.sendCommand(`/device/location?serial=${this.query.serialNumber}`, {});
        const data = await response.json();
        console.log("refreshLocations:", data);
        return data.code === 200;
    }
    async getLocations() {
        const response = await this.sendCommand(`/device/location?serial=${this.query.serialNumber}`);
        const { data: { locationList }, } = await response.json();
        return locationList.map((location) => ({
            serialNumber: this.query.serialNumber,
            latitude: Number(location.location_gg.split(",")[0]),
            longitude: Number(location.location_gg.split(",")[1]),
        }));
    }
    async removeMDM(password) {
        throw new Error("not_implemented");
    }
    async removePassword() {
        try {
            const response = await this.sendCommand(`/device/clearPasscode?serial=${this.query.serialNumber}`, {});
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
            const response = await this.sendCommand("/device/wallpaper", {
                wp_id: wallpaper,
                wp_type: 2,
                allowed: changeable ? 0 : 1,
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
        const params = new URLSearchParams({
            current: "1",
            pageSize: "1",
            mch_name: MDM_USERNAME,
        });
        const response = await this.sendCommand(`/user/merchant?${params.toString()}`);
        const { data: { list }, } = await response.json();
        return { credit: Number(list[0].merchant_balance) };
    }
}
exports.AppleSeekDreamMDM = AppleSeekDreamMDM;
