"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidOEMMDM = void 0;
const infinix_1 = __importDefault(require("./lib/android/infinix"));
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
        const data = await infinix_1.default.getDeviceStatus(this.query.imei);
        console.log("🚀 ~ AndroidOEMMDM ~ init ~ data:", data);
        throw new Error("not_implemented");
    }
    async getDevice() {
        throw new Error("not_implemented");
    }
    async enableLostMode(phoneNumber, content) {
        throw new Error("not_implemented");
    }
    async disableLostMode() {
        throw new Error("not_implemented");
    }
    async getLocations() {
        throw new Error("not_implemented");
    }
    async removeMDM(password) {
        throw new Error("not_implemented");
    }
    async removePassword() {
        throw new Error("not_implemented");
    }
    async hideApp() {
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
