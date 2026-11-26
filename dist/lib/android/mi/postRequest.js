"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRequest = void 0;
const rsaUtils_1 = require("./rsaUtils");
class PostRequest {
    constructor(init) {
        this.appId = "";
        this.requestId = "";
        this.method = "";
        this.version = "1.0";
        this.compressed = false;
        if (init) {
            this.appId = init.appId ?? "";
            this.requestId = init.requestId ?? "";
            this.method = init.method ?? "";
            this.params = init.params;
            this.version = init.version ?? "1.0";
            this.sign = init.sign;
            this.key = init.key;
            this.timestamp =
                init.timestamp !== undefined ? Number(init.timestamp) : undefined;
            this.compressed = init.compressed === true || init.compressed === "true";
        }
    }
    /**
     * Verifies the signature of the request against the Xiaomi/MiFi public key.
     */
    verifySign(publicKey) {
        if (!this.sign) {
            return false;
        }
        const map = {
            appId: this.appId,
            compressed: this.compressed,
            key: this.key,
            method: this.method,
            requestId: this.requestId,
            version: this.version,
        };
        if (this.timestamp !== undefined && this.timestamp > 0) {
            map.timestamp = this.timestamp;
        }
        if (this.params !== undefined && this.params !== null) {
            map.params = this.params;
        }
        const sortedKeys = Object.keys(map).sort();
        const parts = [];
        for (const k of sortedKeys) {
            parts.push(`${k}=${map[k]}`);
        }
        const content = parts.join("&");
        return rsaUtils_1.RSAUtils.verifySignByPublicKey(content, this.sign, publicKey);
    }
    toJSON() {
        const obj = {
            appId: this.appId,
            requestId: this.requestId,
            method: this.method,
            version: this.version,
            compressed: this.compressed,
        };
        if (this.params !== undefined)
            obj.params = this.params;
        if (this.key !== undefined)
            obj.key = this.key;
        if (this.timestamp !== undefined)
            obj.timestamp = this.timestamp;
        if (this.sign !== undefined)
            obj.sign = this.sign;
        return obj;
    }
}
exports.PostRequest = PostRequest;
