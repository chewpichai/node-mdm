"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompressGzip = decompressGzip;
exports.getSignContent = getSignContent;
exports.testEncryptedAndSignature = testEncryptedAndSignature;
const zlib_1 = __importDefault(require("zlib"));
const aesUtils_1 = require("./aesUtils");
const errorCode_1 = require("./errorCode");
const partnerResponse_1 = require("./partnerResponse");
const postRequest_1 = require("./postRequest");
const rsaUtils_1 = require("./rsaUtils");
const APP_ID = process.env.MI_GUARD_APP_ID;
const ORG_NO = process.env.MI_GUARD_ORG_NO;
const PUBLIC_KEY = process.env.MI_GUARD_PUBLIC_KEY;
const PRIVATE_KEY = process.env.MI_GUARD_PRIVATE_KEY;
const MI_PUBLIC_KEY = process.env.MI_GUARD_MI_PUBLIC_KEY;
/**
 * Compresses string with GZIP, matching Java's GZIPOutputStream.
 */
function compressGzip(str) {
    return zlib_1.default.gzipSync(Buffer.from(str, "utf8"));
}
/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
function decompressGzip(buf) {
    return zlib_1.default.gunzipSync(buf).toString("utf8");
}
/**
 * Builds the canonical sign content string by sorting keys lexicographically
 * (ASCII order, matching Java TreeMap) and formatting as key=value&key=value.
 * Null, undefined, and empty string values are skipped.
 */
function getSignContent(params) {
    const sortedKeys = Object.keys(params).sort();
    const parts = [];
    for (const key of sortedKeys) {
        const val = params[key];
        if (val !== undefined && val !== null && val !== "") {
            parts.push(`${key}=${val}`);
        }
    }
    return parts.join("&");
}
/**
 * Signs parameter map with RSA private key (SHA1WithRSA, URL-safe Base64).
 */
function signByPrivateKey(paramsMap, privateKey) {
    const content = getSignContent(paramsMap);
    return rsaUtils_1.RSAUtils.signByPrivateKey(content, privateKey);
}
/**
 * Decrypts the params field in PostRequest using partner private key.
 */
function partnerDecrypt(request, partnerPrivateKey) {
    if (!request.key) {
        return false;
    }
    const key = rsaUtils_1.RSAUtils.decryptByPrivateKey(request.key, partnerPrivateKey);
    if (!key) {
        return false;
    }
    const hasData = Boolean(request.params);
    let decrypted = null;
    if (hasData && request.params) {
        decrypted = aesUtils_1.AESUtils.decrypt(request.params, key);
    }
    // If payload was compressed, decompress GZIP after AES decryption
    if (decrypted && request.compressed) {
        try {
            decrypted = decompressGzip(Buffer.from(decrypted, "base64"));
        }
        catch (e) {
            console.error("gzip decompress error", e);
        }
    }
    request.params = decrypted ?? undefined;
    if (hasData && decrypted === null) {
        return false;
    }
    return true;
}
/**
 * Decrypts the data field in PartnerResponse using MiFi private key.
 */
function decrypt(response, mifiPrivateKey) {
    if (!response.encrypted) {
        return true;
    }
    if (!response.key) {
        return false;
    }
    const key = rsaUtils_1.RSAUtils.decryptByPrivateKey(response.key, mifiPrivateKey);
    if (!key) {
        response.setCode(errorCode_1.ErrorCode.ERROR_DECRYPT.code);
        response.desc = errorCode_1.ErrorCode.ERROR_DECRYPT.desc;
        return false;
    }
    const hasData = Boolean(response.data);
    let decrypted = null;
    if (hasData && response.data) {
        decrypted = aesUtils_1.AESUtils.decrypt(response.data, key);
    }
    // Set encrypted to false even if failed to decrypt data to avoid decrypting again
    response.encrypted = false;
    response.data = decrypted ?? undefined;
    if (hasData && decrypted === null) {
        response.setCode(errorCode_1.ErrorCode.ERROR_DECRYPT.code);
        response.desc = errorCode_1.ErrorCode.ERROR_DECRYPT.desc;
        return false;
    }
    return true;
}
function getPostParams(appId, requestId, method, params, compressed) {
    let bizParams = JSON.stringify(params);
    const paramsMap = {
        appId,
        requestId,
        method,
    };
    const key = aesUtils_1.AESUtils.generateAESKey();
    const encryptedKey = rsaUtils_1.RSAUtils.encryptByPublicKey(key, PUBLIC_KEY);
    if (!encryptedKey) {
        throw new Error("Failed to encrypt AES key with partner public key");
    }
    paramsMap["key"] = encryptedKey;
    paramsMap["version"] = "1.0";
    paramsMap["timestamp"] = String(Date.now());
    if (compressed) {
        bizParams = compressGzip(bizParams).toString("base64");
        paramsMap["compressed"] = "true";
    }
    else {
        paramsMap["compressed"] = "false";
    }
    const encryptedParams = aesUtils_1.AESUtils.encrypt(bizParams, key);
    if (!encryptedParams) {
        throw new Error("Failed to encrypt params with AES key");
    }
    paramsMap["params"] = encryptedParams;
    const sign = signByPrivateKey(paramsMap, PRIVATE_KEY);
    if (!sign) {
        throw new Error("Failed to generate signature with MiFi private key");
    }
    paramsMap["sign"] = sign;
    return paramsMap;
}
function parseRequest(content) {
    const raw = JSON.parse(content);
    const request = new postRequest_1.PostRequest(raw);
    const verified = request.verifySign(MI_PUBLIC_KEY);
    if (verified) {
        partnerDecrypt(request, PRIVATE_KEY);
    }
    else {
        console.warn("parseRequest signature verification failed!");
    }
    return JSON.stringify(request.toJSON());
}
/**
 * Builds encrypted & signed partner response parameters.
 */
function getResponse(params) {
    const bizParams = JSON.stringify(params);
    const paramsMap = {
        success: "true",
        code: "0",
        desc: "成功",
    };
    const key = aesUtils_1.AESUtils.generateAESKey();
    const encryptedKey = rsaUtils_1.RSAUtils.encryptByPublicKey(key, MI_PUBLIC_KEY);
    if (!encryptedKey) {
        throw new Error("Failed to encrypt AES key with MiFi public key");
    }
    paramsMap["key"] = encryptedKey;
    paramsMap["encrypted"] = "true";
    paramsMap["timestamp"] = String(Date.now());
    const encryptedData = aesUtils_1.AESUtils.encrypt(bizParams, key);
    if (!encryptedData) {
        throw new Error("Failed to encrypt data with AES key");
    }
    paramsMap["data"] = encryptedData;
    const sign = signByPrivateKey(paramsMap, PRIVATE_KEY);
    if (!sign) {
        throw new Error("Failed to generate signature with partner private key");
    }
    paramsMap["sign"] = sign;
    return paramsMap;
}
/**
 * Parses and decrypts a PartnerResponse JSON string.
 */
function parseResponse(content) {
    const raw = JSON.parse(content);
    const response = new partnerResponse_1.PartnerResponse(raw);
    const verified = response.verifySign(PUBLIC_KEY);
    if (verified) {
        decrypt(response, PRIVATE_KEY);
    }
    else {
        console.warn("parseResponse signature verification failed!");
    }
    return JSON.stringify(response.toJSON());
}
function testEncryptedAndSignature() {
    sendCommand("https://staging-merchant-api.ginstal.xiaomi.com/v1/partner");
}
async function sendCommand(url) {
    const params = {
        financialOrgNo: ORG_NO,
        deviceRegisterNo: "868506080036129",
    };
    const postParams = getPostParams(APP_ID, "123", "mi.lock.device.status", params, false);
    const formBody = new URLSearchParams(postParams);
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: formBody.toString(),
    });
    const bodyText = await res.text();
    console.log("🚀 ~ sendCommand ~ bodyText:", bodyText);
    const parsedResponse = parseResponse(bodyText);
    console.log("parsedResponse : " + parsedResponse);
}
