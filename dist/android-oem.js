"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidOEMMDM = void 0;
const OEM = __importStar(require("./lib/android"));
class AndroidOEMMDM {
    static async getInstance(query) {
        const instance = new AndroidOEMMDM(query);
        await instance.init();
        return instance;
    }
    constructor(query) {
        this.tokenKey = "androidOEMMDMToken";
        this.token = null;
        this.query = query;
    }
    async sendCommand(url, data) {
        throw new Error("not_implemented");
    }
    async init() {
        if (!this.query.subBrand)
            throw new Error("subbrand_required");
        this.oem = OEM[this.query.subBrand];
    }
    async enroll() {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        return this.oem.uploadDevice(this.query.imei);
    }
    async getDevice() {
        throw new Error("not_implemented");
    }
    async getDeviceStatus() {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        return this.oem.getDeviceStatus(this.query.imei);
    }
    async enableLostMode(phoneNumber, content) {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        const locked = await this.oem.lockDevice(this.query.imei, phoneNumber, content);
        return [locked, undefined];
    }
    async disableLostMode() {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        const unlocked = await this.oem.unlockDevice(this.query.imei);
        return [unlocked, undefined];
    }
    async sendMessage(phoneNumber, content) {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        return this.oem.sendMessage(this.query.imei, phoneNumber, content);
    }
    async getLocations() {
        throw new Error("not_implemented");
    }
    async removeMDM(password) {
        if (!this.query.imei)
            throw new Error("imei_required");
        if (!this.oem)
            throw new Error("oem_not_found");
        return this.oem.completeDevice(this.query.imei);
    }
    async removePassword() {
        throw new Error("not_implemented");
    }
    async hideApp() {
        return [false, undefined];
    }
    async disableHideApp() {
        return [false, undefined];
    }
    async uploadWallpaper(wallpaper) {
        return true;
    }
    async setWallpaper(changeable, wallpaperId) {
        throw new Error("not_implemented");
    }
    async getCredit() {
        return { credit: 0 };
    }
}
exports.AndroidOEMMDM = AndroidOEMMDM;
