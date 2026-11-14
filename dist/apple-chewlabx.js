"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleChewLabxMDM = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const _1 = require(".");
const cache_1 = require("./lib/cache");
const logger_1 = require("./lib/logger");
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
    async sendCommand(url, body, method = "GET") {
        if (!this.token)
            throw new Error("token_not_found");
        const response = await fetch(`${MDM_URL}${url}`, {
            method,
            headers: {
                ...(body instanceof FormData
                    ? {}
                    : { "content-type": "application/json" }),
                authorization: `Bearer ${this.token}`,
            },
            body: method === "GET"
                ? undefined
                : body instanceof FormData
                    ? body
                    : JSON.stringify(body),
        });
        const text = await response.text();
        let responseBody = text;
        let parseError;
        if (!text.trim()) {
            responseBody = undefined;
        }
        else {
            try {
                responseBody = JSON.parse(text);
            }
            catch (error) {
                parseError = error;
            }
        }
        const requestBody = method === "GET"
            ? undefined
            : body instanceof FormData
                ? Object.fromEntries(Array.from(body.entries(), ([key, value]) => [
                    key,
                    typeof Blob !== "undefined" && value instanceof Blob
                        ? {
                            ...("name" in value ? { name: value.name } : {}),
                            size: value.size,
                            type: value.type,
                        }
                        : value,
                ]))
                : body;
        const identifier = this.query.serialNumber || this.query.applicationId;
        const prefix = identifier
            ? `🚀 ~ AppleChewLabxMDM ~ sendCommand ~ ${identifier} ~ ${method} ${url}:`
            : `🚀 ~ AppleChewLabxMDM ~ sendCommand ~ ${method} ${url}:`;
        const logFn = !response.ok || parseError !== undefined ? logger_1.logger.warn : logger_1.logger.log;
        logFn(prefix, {
            ...(response.ok ? {} : { status: response.status }),
            requestBody,
            responseBody,
        });
        if (!response.ok) {
            throw new Error(`network_error_${response.status}`);
        }
        if (parseError !== undefined) {
            throw parseError;
        }
        return responseBody;
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
            const device = await this.sendCommand(`/devices/${this.query.serialNumber}`);
            if (!device?.serial_number)
                throw new Error("device_not_found");
            if (this.query.serialNumber &&
                device.serial_number !== this.query.serialNumber) {
                throw new Error("device_not_found");
            }
            const functionRestrictData = JSON.stringify(Object.fromEntries(Object.entries(device.restrictions).map(([key, value]) => [
                key,
                value ? "true" : "false",
            ])));
            const deviceStatus = this.getDeviceStatus(device.status);
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
                deviceCapacity: device.capacity ? `${device.capacity}GB` : "",
                osVersion: device.os_version ?? "",
            };
        }
        catch (error) {
            logger_1.logger.warn(`getDevice ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
        }
    }
    getDeviceStatus(status) {
        switch (status) {
            case "normal":
                return _1.DeviceStatus.active;
            case "deleted":
                return _1.DeviceStatus.completed;
            case "lost_mode":
                return _1.DeviceStatus.locked;
            case "hide_apps":
                return _1.DeviceStatus.rent;
            default:
                return _1.DeviceStatus.unknown;
        }
    }
    async getEscrowKey() {
        try {
            const { escrow_key } = await this.sendCommand(`/devices/${this.query.serialNumber}/escrow-key`);
            return escrow_key;
        }
        catch (error) {
            logger_1.logger.warn(`getEscrowKey ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
        }
    }
    async enableLostMode(phoneNumber, content) {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/lock`, {
                message: content,
                phone: phoneNumber,
                footnote: phoneNumber,
            }, "PUT");
            return [status === "locking", undefined];
        }
        catch (error) {
            logger_1.logger.warn(`enableLostMode ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return [false, undefined];
        }
    }
    async disableLostMode() {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/unlock`, undefined, "PUT");
            return [status === "unlocking", undefined];
        }
        catch (error) {
            logger_1.logger.warn(`disableLostMode ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return [false, undefined];
        }
    }
    async refreshLocation() {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/locations`, undefined, "POST");
            return status === "success";
        }
        catch (error) {
            logger_1.logger.warn(`refreshLocation ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async getLocations() {
        const locations = await this.sendCommand(`/devices/${this.query.serialNumber}/locations`);
        return locations.map((loc) => ({
            lat: loc.latitude,
            lng: loc.longitude,
        }));
    }
    async removeMDM(password) {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}`, undefined, "DELETE");
            return status === "deleted";
        }
        catch (error) {
            logger_1.logger.warn(`removeMDM ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async removePassword() {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/passcode`, undefined, "DELETE");
            return status === "clearing";
        }
        catch (error) {
            logger_1.logger.warn(`removePassword ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async hideApp() {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/hide-apps`, undefined, "PUT");
            return [status === "hiding", undefined];
        }
        catch (error) {
            logger_1.logger.warn(`hideApp ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return [false, undefined];
        }
    }
    async disableHideApp() {
        return this.disableLostMode();
    }
    async setPermissions(permissions) {
        try {
            await this.sendCommand(`/devices/${this.query.serialNumber}/restrictions`, permissions, "PUT");
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`setPermissions ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
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
            logger_1.logger.warn(`setWallpaper ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async updateOS() {
        try {
            const { status } = await this.sendCommand(`/devices/${this.query.serialNumber}/os-update`, undefined, "POST");
            return status === "scheduling";
        }
        catch (error) {
            logger_1.logger.warn(`updateOS ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async disableUSB() {
        try {
            await this.sendCommand(`/devices/${this.query.serialNumber}/restrictions`, { allowUSBRestrictedMode: true }, "PUT");
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`disableUSB ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
            return false;
        }
    }
    async enableUSB() {
        try {
            await this.sendCommand(`/devices/${this.query.serialNumber}/restrictions`, { allowUSBRestrictedMode: false }, "PUT");
            return true;
        }
        catch (error) {
            logger_1.logger.warn(`enableUSB ~ serialNumber: ${this.query.serialNumber}, error: ${error}`);
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
