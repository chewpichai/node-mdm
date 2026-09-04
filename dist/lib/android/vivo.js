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
exports.VTrustOpenAPI = exports.VTrustControlType = void 0;
exports.uploadDevice = uploadDevice;
exports.getDeviceStatus = getDeviceStatus;
exports.lockDevice = lockDevice;
exports.unlockDevice = unlockDevice;
exports.sendMessage = sendMessage;
exports.completeDevice = completeDevice;
const crypto = __importStar(require("crypto"));
var VTrustControlType;
(function (VTrustControlType) {
    VTrustControlType[VTrustControlType["LOCK"] = 1] = "LOCK";
    VTrustControlType[VTrustControlType["UNLOCK"] = 2] = "UNLOCK";
    VTrustControlType[VTrustControlType["SET_LOCK_TIME"] = 3] = "SET_LOCK_TIME";
})(VTrustControlType || (exports.VTrustControlType = VTrustControlType = {}));
const BASE_URL = process.env.VIVO_BASE_URL;
const CLIENT_ID = process.env.VIVO_CLIENT_ID;
const CLIENT_SECRET = process.env.VIVO_CLIENT_SECRET;
const MANUFACTURER = process.env.VIVO_MANUFACTURER;
const AES_IV = process.env.VIVO_AES_IV;
const AES_KEY = process.env.VIVO_AES_KEY;
class VTrustOpenAPI {
    /**
     * Generate headers for request
     */
    generateHeaders(body) {
        const timestamp = Date.now().toString();
        const transactionId = crypto.randomUUID();
        const signature = crypto
            .createHash("sha256")
            .update(transactionId + CLIENT_ID + timestamp + body + CLIENT_SECRET, "utf8")
            .digest("hex");
        return {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "-x-vtrust-transactionId": transactionId,
            "-x-vtrust-clientId": CLIENT_ID,
            "-x-vtrust-timestamp": timestamp,
            "-x-vtrust-signature": signature,
        };
    }
    /**
     * Encrypt request body with AES/GCM
     * Returns base64 string of (nonce + ciphertext + tag)
     */
    aesEncrypt(data) {
        const key = Buffer.from(AES_KEY, "base64");
        const iv = Buffer.from(AES_IV, "base64");
        const algorithm = key.length === 16
            ? "aes-128-gcm"
            : key.length === 24
                ? "aes-192-gcm"
                : "aes-256-gcm";
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(data, "utf8"),
            cipher.final(),
        ]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, ciphertext, tag]).toString("base64");
    }
    /**
     * Decrypt AES/GCM encrypted base64 string
     */
    aesDecrypt(encryptedBase64) {
        const key = Buffer.from(AES_KEY, "base64");
        const iv = Buffer.from(AES_IV, "base64");
        const algorithm = key.length === 16
            ? "aes-128-gcm"
            : key.length === 24
                ? "aes-192-gcm"
                : "aes-256-gcm";
        const buf = Buffer.from(encryptedBase64, "base64");
        const nonce = buf.subarray(0, iv.length);
        const tag = buf.subarray(buf.length - 16);
        const ciphertext = buf.subarray(iv.length, buf.length - 16);
        const decipher = crypto.createDecipheriv(algorithm, key, nonce);
        decipher.setAuthTag(tag);
        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString("utf8");
    }
    async post(endpoint, data) {
        const url = `${BASE_URL}${endpoint}`;
        const jsonData = JSON.stringify(data);
        const encryptedParam = this.aesEncrypt(jsonData);
        const headers = this.generateHeaders(jsonData);
        const body = new URLSearchParams({ param: encryptedParam }).toString();
        const response = await fetch(url, {
            method: "POST",
            headers,
            body,
        });
        const resData = (await response.json());
        return resData;
    }
    async enroll(imeiOrOptions, lockTime, lockTimeDelayPeriod = 0, warnMsgAfterLocked = "เครื่องถูกล็อคเนื่องจากมียอดค้างชำระ กรุณาชำระยอดค้าง +ค่าปรับ 100 บาท ติดต่อ Line @Srisawadphone", remindBeforePhoneLock = 1440, warnMsgBeforeLocked = "เครื่องของท่านกำลังจะถูกล็อค กรุณาชำระยอดค้างโดยด่วน", phoneLockRemindUrl = "") {
        let data;
        if (typeof imeiOrOptions === "object" && imeiOrOptions !== null) {
            data = {
                deviceId: imeiOrOptions.imei,
                lockTimeDelayPeriod: imeiOrOptions.lockTimeDelayPeriod ?? 0,
                warnMsgAfterLocked: imeiOrOptions.warnMsgAfterLocked ??
                    "เครื่องถูกล็อคเนื่องจากมียอดค้างชำระ กรุณาชำระยอดค้าง +ค่าปรับ 100 บาท ติดต่อ Line @Srisawadphone",
                remindBeforePhoneLock: imeiOrOptions.remindBeforePhoneLock ?? 1440,
                warnMsgBeforeLocked: imeiOrOptions.warnMsgBeforeLocked ??
                    "เครื่องของท่านกำลังจะถูกล็อค กรุณาชำระยอดค้างโดยด่วน",
                phoneLockRemindUrl: imeiOrOptions.phoneLockRemindUrl ?? "",
            };
            if (imeiOrOptions.lockTime !== undefined &&
                imeiOrOptions.lockTime !== null) {
                data.lockTime = imeiOrOptions.lockTime;
            }
        }
        else {
            data = {
                deviceId: imeiOrOptions,
                lockTimeDelayPeriod,
                warnMsgAfterLocked,
                remindBeforePhoneLock,
                warnMsgBeforeLocked,
                phoneLockRemindUrl,
            };
            if (lockTime !== undefined && lockTime !== null) {
                data.lockTime = lockTime;
            }
        }
        return this.post(`/openapi/v2/${MANUFACTURER}/device/create`, data);
    }
    /**
     * Re-send the auth code to a device
     *
     * @param imei - Device imei
     */
    async sendAuthCode(imei) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/send-auth-code`, {
            deviceId: imei,
        });
    }
    /**
     * Verify the auth code for a device
     *
     * @param imei - Device imei
     * @param authCode - Auth code shown on device
     */
    async verifyAuthCode(imei, authCode) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/verify-auth-code`, {
            deviceId: imei,
            authCode,
        });
    }
    /**
     * Lock/unlock/set the lockTime of a device
     *
     * @param imei - Device imei
     * @param controlType - 1: Lock instantly. 2: Unlock instantly. 3: Set lock timestamp
     * @param lockTime - Device lock timestamp to set (only needed when controlType is 3)
     */
    async control(imei, controlType, lockTime) {
        const data = {
            deviceId: imei,
            type: controlType,
        };
        if (controlType === 3 && lockTime !== undefined && lockTime !== null) {
            data.lockTime = lockTime;
        }
        return this.post(`/openapi/v2/${MANUFACTURER}/device/control`, data);
    }
    /**
     * Send a message to a device
     *
     * @param imei - Device imei
     * @param msgTitle - Title of message
     * @param msgContent - Content of message
     */
    async message(imei, msgTitle, msgContent) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/remind-message`, {
            deviceId: imei,
            msgTitle,
            msgContent,
        });
    }
    /**
     * Query a PIN code to unlock a device
     *
     * @param imei - Device imei
     */
    async queryUnlockPin(imei) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/unlock-pin`, {
            deviceId: imei,
        });
    }
    /**
     * Query a device's state
     *
     * @param imei - Device imei
     */
    async queryDeviceInfo(imei) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/info`, {
            deviceId: imei,
        });
    }
    /**
     * Release a device from control (not reversible)
     *
     * @param imei - Device imei
     */
    async completeContract(imei) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/complete-contract`, {
            deviceId: imei,
        });
    }
    /**
     * Delete a completed or unauthorized device (not reversible)
     *
     * @param imei - Device imei
     */
    async delete(imei) {
        return this.post(`/openapi/v2/${MANUFACTURER}/device/remove`, {
            deviceId: imei,
        });
    }
}
exports.VTrustOpenAPI = VTrustOpenAPI;
// Standalone OEM functions compatible with AndroidOEMMDM interface
let defaultClient = null;
function getClient() {
    if (!defaultClient) {
        defaultClient = new VTrustOpenAPI();
    }
    return defaultClient;
}
async function uploadDevice(imei) {
    const data = await getClient().enroll(imei);
    console.log("🚀 ~ uploadDevice ~ data:", data);
    const isSuccess = data.message === "SUCCESS";
    if (isSuccess)
        return 200;
    return 461;
}
async function getDeviceStatus(imei) {
    const data = await getClient().queryDeviceInfo(imei);
    console.log("🚀 ~ getDeviceStatus ~ data:", data);
    switch (data?.data?.status) {
        case 1:
            return "active";
        case 2:
            return "active";
        case 3:
            return "lock";
        case 4:
            return "locked";
        case 5:
            return "unlocking";
        case 6:
            return "completed";
        case 7:
            return "completing";
        case 8:
            return "activating";
        case 9:
            return "unauthorized";
        default:
            return "unknown";
    }
}
async function lockDevice(imei, phone, message) {
    const data = await getClient().control(imei, 1);
    console.log("🚀 ~ lockDevice ~ data:", data);
    return data.message === "SUCCESS";
}
async function unlockDevice(imei) {
    const data = await getClient().control(imei, 2);
    console.log("🚀 ~ unlockDevice ~ data:", data);
    return data.message === "SUCCESS";
}
async function sendMessage(imei, phone, message) {
    const data = await getClient().message(imei, phone, message);
    console.log("🚀 ~ sendMessage ~ data:", data);
    return data.message === "SUCCESS";
}
async function completeDevice(imei) {
    const data = await getClient().completeContract(imei);
    console.log("🚀 ~ completeDevice ~ data:", data);
    return data.message === "SUCCESS";
}
exports.default = {
    uploadDevice,
    getDeviceStatus,
    lockDevice,
    unlockDevice,
    sendMessage,
    completeDevice,
};
