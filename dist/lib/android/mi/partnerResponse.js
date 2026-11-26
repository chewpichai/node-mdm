"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerResponse = void 0;
const rsaUtils_1 = require("./rsaUtils");
const errorCode_1 = require("./errorCode");
class PartnerResponse {
    constructor(init) {
        this.success = false;
        this.code = 0;
        this.desc = "";
        this.encrypted = false;
        if (init) {
            this.success = init.success === true || init.success === "true";
            this.code = init.code !== undefined ? Number(init.code) : 0;
            this.desc = init.desc || "";
            this.encrypted = init.encrypted === true || init.encrypted === "true";
            this.data = init.data;
            this.key = init.key;
            this.timestamp =
                init.timestamp !== undefined ? Number(init.timestamp) : undefined;
            this.sign = init.sign;
            if (this.code !== errorCode_1.ErrorCode.SUCCESS.code) {
                this.success = false;
            }
        }
    }
    setCode(code) {
        this.code = code;
        if (code !== errorCode_1.ErrorCode.SUCCESS.code) {
            this.success = false;
        }
    }
    /**
     * Verifies the signature of the response against the partner public key.
     */
    verifySign(publicKey) {
        if (!this.sign) {
            return false;
        }
        const map = {
            code: this.code,
            encrypted: this.encrypted,
            success: this.success,
        };
        if (this.data !== undefined && this.data !== null) {
            map.data = this.data;
        }
        if (this.desc !== undefined && this.desc !== null && this.desc !== "") {
            map.desc = this.desc;
        }
        if (this.key !== undefined && this.key !== null) {
            map.key = this.key;
        }
        if (this.timestamp !== undefined && this.timestamp > 0) {
            map.timestamp = this.timestamp;
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
            success: this.success,
            code: this.code,
            desc: this.desc,
            encrypted: this.encrypted,
        };
        if (this.data !== undefined)
            obj.data = this.data;
        if (this.key !== undefined)
            obj.key = this.key;
        if (this.timestamp !== undefined)
            obj.timestamp = this.timestamp;
        if (this.sign !== undefined)
            obj.sign = this.sign;
        return obj;
    }
}
exports.PartnerResponse = PartnerResponse;
