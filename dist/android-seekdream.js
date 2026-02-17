"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidSeekDreamMDM = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dayjs_1 = __importDefault(require("dayjs"));
const cache_1 = require("./lib/cache");
const MDM_URL = process.env.MDM_SEEKDREAM_URL;
const MDM_USERNAME = process.env.MDM_SEEKDREAM_USERNAME;
const MDM_PASSWORD = process.env.MDM_SEEKDREAM_PASSWORD;
const MDM_API_KEY = process.env.MDM_SEEKDREAM_API_KEY;
const MDM_SEEKDREAM_SECOND_PASSWORD = process.env.MDM_SEEKDREAM_SECOND_PASSWORD;
class AndroidSeekDreamMDM {
    static async getInstance(query) {
        const instance = new AndroidSeekDreamMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "androidSeekDreamMDMToken";
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
    async init() {
        if (this.token)
            return;
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
        if (!this.token) {
            try {
                const hash = crypto_1.default
                    .createHash("md5")
                    .update(MDM_PASSWORD)
                    .digest("hex");
                const response = await fetch(`${MDM_URL}/user/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-API-Key": MDM_API_KEY,
                    },
                    body: JSON.stringify({
                        role: "agent",
                        username: MDM_USERNAME,
                        password: crypto_1.default
                            .createHash("md5")
                            .update(hash.slice(7, -7))
                            .digest("hex"),
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
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        try {
            const params = new URLSearchParams();
            params.append("serial", this.query.serialNumber);
            params.append("current", "1");
            params.append("pageSize", "20");
            const response = await this.sendCommand(`/google/getDeviceList?${params}`);
            const { data: { lists: [device], }, } = await response.json();
            if (!device)
                return undefined;
            return {
                id: device.device_id,
                deviceStatus: device.status_flag,
                description: "",
                serialNumber: device.dc_info.hardwareInfo.serialNumber,
                activationLockStatus: 1,
                functionRestrictData: "",
                httpProxyStatus: 0,
                phoneModel: device.dc_info.hardwareInfo.model,
                commandContentList: null,
                deviceAssignedBy: "",
                color: null,
                createTime: (0, dayjs_1.default)(device.add_time).format("YYYYMMDDHHmmss"),
                merchantId: device.merchant_id,
                imei: device.imei,
            };
        }
        catch {
            return;
        }
    }
    async enableLostMode(phoneNumber, content) {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/lock", {
                serial: this.query.serialNumber,
                merchant_id: this.query.merchantId,
                phone: phoneNumber,
                content,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ enableLostMode ~ data:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/unlock", {
                serial: this.query.serialNumber,
                merchant_id: this.query.merchantId,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ disableLostMode ~ data:", data);
            return [data.code === 200, undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async getLocations() {
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        const params = new URLSearchParams();
        params.append("serial", this.query.serialNumber);
        params.append("current", "1");
        params.append("pageSize", "20");
        params.append("merchant_id", this.query.merchantId);
        const response = await this.sendCommand(`/google/getLocations?${params}`);
        const { data } = await response.json();
        return data.list.map(({ location: { lat, lng }, }) => ({ lat, lng }));
    }
    async removeMDM(password) {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/disown", {
                serial: this.query.serialNumber,
                secondPassword: password,
                merchant_id: this.query.merchantId,
            });
            return response.ok;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async removePassword() {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/clearPassword", {
                serial: this.query.serialNumber,
                merchant_id: this.query.merchantId,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ clearPassword ~ data:", data);
            return response.ok;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async hideApp() {
        return [false, undefined];
    }
    async uploadWallpaper(wallpaper) {
        return true;
    }
    async getWallpapers() {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const params = new URLSearchParams();
            params.append("current", "1");
            params.append("pageSize", "8");
            params.append("merchant_id", this.query.merchantId);
            const response = await this.sendCommand(`/user/wallpaper?${params}`);
            const { data } = await response.json();
            return data.list.map(({ wp_id, wp_url }) => ({
                id: wp_id,
                url: wp_url,
            }));
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }
    async setWallpaper(changeable, wallpaperId) {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/pushWallpaper", {
                serial: this.query.serialNumber,
                wp_type: "3",
                wp_id: wallpaperId,
                allowed: changeable ? "1" : "0",
                merchant_id: this.query.merchantId,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ setWallpaper ~ data:", data);
            return response.ok;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async getCredit() {
        return { credit: 0 };
    }
    async reboot() {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/reboot", {
                serial: this.query.serialNumber,
                merchant_id: this.query.merchantId,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ reboot ~ data:", data);
            return response.ok;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async playSound() {
        if (this.query.brand !== "android-seekdream")
            throw new Error("invalid_brand");
        if (!this.query.merchantId)
            throw new Error("merchant_id_not_found");
        try {
            const response = await this.sendCommand("/google/playSound", {
                serial: this.query.serialNumber,
                merchant_id: this.query.merchantId,
            });
            const data = await response.json();
            console.log("🚀 ~ AndroidSeekDreamMDM ~ playSound ~ data:", data);
            return response.ok;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
}
exports.AndroidSeekDreamMDM = AndroidSeekDreamMDM;
