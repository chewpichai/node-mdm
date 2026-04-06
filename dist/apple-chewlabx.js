"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleChewLabxMDM = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const cache_1 = require("./lib/cache");
const MDM_URL = process.env.MDM_CHEWLABX_URL;
const MDM_USERNAME = process.env.MDM_CHEWLABX_USERNAME;
const MDM_PASSWORD = process.env.MDM_CHEWLABX_PASSWORD;
class AppleChewLabxMDM {
    static async getInstance(query) {
        const instance = new AppleChewLabxMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "appleChewLabxMDMToken";
        this.token = null;
        this.query = query;
    }
    async sendCommand(url, data, method = "GET") {
        if (!this.token)
            throw new Error("token_not_found");
        return await fetch(`${MDM_URL}${url}`, {
            method,
            headers: {
                ...(data instanceof FormData
                    ? {}
                    : { "Content-Type": "application/json" }),
                authorization: `Bearer ${this.token}`,
            },
            body: data instanceof FormData ? data : JSON.stringify(data),
        });
    }
    async init() {
        if (this.token)
            return;
        const cache = (0, cache_1.getCache)();
        this.token = cache.get(this.tokenKey);
        if (!this.token) {
            try {
                const response = await fetch(`${MDM_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: MDM_USERNAME,
                        password: MDM_PASSWORD,
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
        if (this.query.brand !== "apple-chewlabx")
            throw new Error("invalid_brand");
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}`);
            const device = await response.json();
            if (this.query.serialNumber &&
                device.serial_number !== this.query.serialNumber) {
                throw new Error("device_not_found");
            }
            const functionRestrictData = JSON.stringify(Object.fromEntries(Object.entries(device.restrictions).map(([key, value]) => [
                key,
                value ? "true" : "false",
            ])));
            const statusMap = {
                normal: 0,
                deleted: 2,
                lost_mode: 3,
                hide_apps: 4,
            };
            const deviceStatus = statusMap[device.status] ?? 1;
            return {
                id: device.id,
                deviceStatus,
                description: device.description,
                serialNumber: device.serial_number,
                activationLockStatus: 1,
                functionRestrictData,
                httpProxyStatus: 0,
                phoneModel: device.model,
                commandContentList: null,
                deviceAssignedBy: device.device_assigned_by,
                color: device.color,
                createTime: (0, dayjs_1.default)(device.device_assigned_date).format("YYYYMMDDHHmmss"),
                imei: device.imei,
                usbItunesStatus: device.restrictions.allowUSBRestrictedMode ? 1 : 0,
                deviceCapacity: `${device.capacity}GB`,
            };
        }
        catch (error) {
            console.error(error);
        }
    }
    async getEscrowKey() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/escrow-key`);
            const { escrowKey } = await response.json();
            return escrowKey;
        }
        catch (error) {
            console.error(error);
        }
    }
    async enableLostMode(phoneNumber, content) {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/lock`, {
                message: content,
                phone: phoneNumber,
            }, "PUT");
            const { status } = await response.json();
            return [status === "locking", undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/unlock`, undefined, "PUT");
            const { status } = await response.json();
            return [status === "unlocking", undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async refreshLocation() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/locations`, undefined, "POST");
            const { status } = await response.json();
            return status === "success";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async getLocations() {
        const response = await this.sendCommand(`/devices/${this.query.serialNumber}/locations`);
        const locations = await response.json();
        return locations.map((loc) => ({
            lat: loc.latitude,
            lng: loc.longitude,
        }));
    }
    async removeMDM(password) {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/remove`, undefined, "DELETE");
            const { status } = await response.json();
            return status === "deleted";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async removePassword() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/passcode`, undefined, "DELETE");
            const { status } = await response.json();
            return status === "clearing";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async hideApp() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/hide-apps`, undefined, "PUT");
            const { status } = await response.json();
            return [status === "hiding", undefined];
        }
        catch (error) {
            console.error(error);
            return [false, undefined];
        }
    }
    async setPermissions(permissions) {
        try {
            await this.sendCommand(`/devices/${this.query.serialNumber}/restrictions`, Object.fromEntries(Object.entries(permissions).map(([key, value]) => [
                key,
                value === "true",
            ])), "PUT");
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async setWallpaper(changeable, wallpaper) {
        if (!wallpaper)
            throw new Error("wallpaper_not_found");
        try {
            const formData = new FormData();
            formData.append("image", wallpaper);
            formData.append("changeable", changeable ? "1" : "0");
            await this.sendCommand(`/devices/${this.query.serialNumber}/wallpaper`, formData, "PUT");
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async updateOS() {
        try {
            const response = await this.sendCommand(`/devices/${this.query.serialNumber}/os-update`, undefined, "POST");
            const { status } = await response.json();
            return status === "scheduling";
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async clearCommand() {
        try {
            throw new Error("not_implemented");
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
    async uploadWallpaper(wallpaper) {
        return true;
    }
    async getCredit() {
        return { credit: 0 };
    }
}
exports.AppleChewLabxMDM = AppleChewLabxMDM;
