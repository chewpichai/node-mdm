"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AESUtils = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class AESUtils {
    /**
     * Generates a random 128-bit AES key as a Base64-encoded string.
     */
    static generateAESKey() {
        return node_crypto_1.default.randomBytes(16).toString('base64');
    }
    /**
     * Encrypts plaintext string using AES-128-ECB with PKCS5/PKCS7 padding.
     *
     * @param content Plaintext string
     * @param key Base64-encoded 128-bit key
     * @returns Base64-encoded ciphertext, or null on failure
     */
    static encrypt(content, key) {
        try {
            const bytesKey = Buffer.from(key, 'base64');
            const cipher = node_crypto_1.default.createCipheriv('aes-128-ecb', bytesKey, null);
            const encrypted = Buffer.concat([
                cipher.update(content, 'utf8'),
                cipher.final()
            ]);
            return encrypted.toString('base64');
        }
        catch (e) {
            console.error('encrypt error', e);
            return null;
        }
    }
    /**
     * Decrypts Base64-encoded ciphertext using AES-128-ECB with PKCS5/PKCS7 padding.
     *
     * @param content Base64-encoded ciphertext
     * @param key Base64-encoded 128-bit key
     * @returns Plaintext string, or null on failure
     */
    static decrypt(content, key) {
        try {
            const bytesKey = Buffer.from(key, 'base64');
            const decipher = node_crypto_1.default.createDecipheriv('aes-128-ecb', bytesKey, null);
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(content, 'base64')),
                decipher.final()
            ]);
            return decrypted.toString('utf8');
        }
        catch (e) {
            console.error('decrypt error', e);
            return null;
        }
    }
}
exports.AESUtils = AESUtils;
AESUtils.KEY_ALGORITHM = 'AES';
AESUtils.ENCODING = 'utf-8';
