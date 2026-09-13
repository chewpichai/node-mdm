"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.possefySign = possefySign;
exports.oGuardSign = oGuardSign;
const crypto_1 = __importDefault(require("crypto"));
const CLIENT_SECRET = process.env.OPPO_CLIENT_SECRET;
const CARRIER_CODE = process.env.OPPO_CARRIER_CODE;
const TOKEN = process.env.OPPO_TOKEN;
function possefySign(body) {
    const timestamp = new Date(Date.now() + 7 * 60 * 60 * 1000)
        .toISOString()
        .replace(/\D/g, "")
        .slice(0, 14);
    const signature = crypto_1.default
        .createHmac("sha256", CLIENT_SECRET)
        .update(body + timestamp)
        .digest("base64");
    return { timestamp, signature };
}
function oGuardSign(body) {
    const dataToSign = `${body},${CARRIER_CODE},${TOKEN}`;
    return crypto_1.default
        .createHash("sha256")
        .update(dataToSign, "utf8")
        .digest("base64");
}
