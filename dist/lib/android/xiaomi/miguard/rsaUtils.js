"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSAUtils = void 0;
exports.getSignContent = getSignContent;
exports.compressGzip = compressGzip;
exports.decompressGzip = decompressGzip;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_zlib_1 = __importDefault(require("node:zlib"));
function cleanBase64Key(rawKey) {
    const clean = rawKey.replace(/[\r\n\s]/g, '');
    return Buffer.from(clean, 'base64');
}
/**
 * PKCS#1 v1.5 padding removal for RSA encryption block type 02 (public key encryption).
 * Format: 0x00 0x02 [non-zero padding bytes >= 8] 0x00 [data]
 * This allows decrypting with RSA PKCS#1 v1.5 padding in modern Node.js versions (v21+).
 */
function pkcs1Unpad(buf) {
    let idx = 0;
    if (buf[0] === 0x00 && buf[1] === 0x02) {
        idx = 2;
    }
    else if (buf[0] === 0x02) {
        idx = 1;
    }
    else {
        throw new Error('Invalid PKCS#1 padding: missing leading 0x00 0x02 marker');
    }
    while (idx < buf.length && buf[idx] !== 0x00) {
        idx++;
    }
    if (idx >= buf.length) {
        throw new Error('Invalid PKCS#1 padding: missing delimiter 0x00');
    }
    return buf.subarray(idx + 1);
}
class RSAUtils {
    /**
     * Parses Base64-encoded X.509 SPKI public key.
     */
    static getPublicKey(key) {
        const der = cleanBase64Key(key);
        return node_crypto_1.default.createPublicKey({ key: der, format: 'der', type: 'spki' });
    }
    /**
     * Parses Base64-encoded PKCS#8 private key.
     */
    static getPrivateKey(key) {
        const der = cleanBase64Key(key);
        return node_crypto_1.default.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
    }
    /**
     * RSA private key signing using SHA1WithRSA.
     * Output is URL-safe Base64 encoded without padding (matching Apache Commons encodeBase64URLSafe).
     *
     * @param content String to sign
     * @param privateKey Base64-encoded PKCS#8 private key
     * @returns URL-safe Base64 signature string, or null on error
     */
    static signByPrivateKey(content, privateKey) {
        try {
            const priKey = this.getPrivateKey(privateKey);
            const signer = node_crypto_1.default.createSign('RSA-SHA1');
            signer.update(content, 'utf8');
            return signer.sign(priKey, 'base64url');
        }
        catch (e) {
            console.error('sign error', e);
            return null;
        }
    }
    /**
     * RSA public key signature verification for SHA1WithRSA.
     * Accepts both standard and URL-safe Base64 signatures.
     *
     * @param content String that was signed
     * @param sign Base64 or URL-safe Base64 signature
     * @param publicKey Base64-encoded X.509 SPKI public key
     * @returns true if valid, false otherwise
     */
    static verifySignByPublicKey(content, sign, publicKey) {
        try {
            const pubKey = this.getPublicKey(publicKey);
            const verifier = node_crypto_1.default.createVerify('RSA-SHA1');
            verifier.update(content, 'utf8');
            const signBuf = Buffer.from(sign, 'base64url');
            return verifier.verify(pubKey, signBuf);
        }
        catch (e) {
            console.error('verify sign error', e);
            return false;
        }
    }
    /**
     * Encrypts plaintext using RSA public key with PKCS#1 v1.5 padding.
     *
     * @param plainText Plaintext to encrypt
     * @param publicKey Base64-encoded public key
     * @returns Standard Base64-encoded ciphertext, or null on error
     */
    static encryptByPublicKey(plainText, publicKey) {
        try {
            const pubKey = this.getPublicKey(publicKey);
            const encrypted = node_crypto_1.default.publicEncrypt({
                key: pubKey,
                padding: node_crypto_1.default.constants.RSA_PKCS1_PADDING
            }, Buffer.from(plainText, 'utf8'));
            return encrypted.toString('base64');
        }
        catch (e) {
            console.error('encrypt error', e);
            return null;
        }
    }
    /**
     * Encrypts plaintext using RSA public key, returns URL-safe Base64 string.
     */
    static encryptURLSafeByPublicKey(plainText, publicKey) {
        try {
            const pubKey = this.getPublicKey(publicKey);
            const encrypted = node_crypto_1.default.publicEncrypt({
                key: pubKey,
                padding: node_crypto_1.default.constants.RSA_PKCS1_PADDING
            }, Buffer.from(plainText, 'utf8'));
            return encrypted.toString('base64url');
        }
        catch (e) {
            console.error('encrypt URL safe error', e);
            return null;
        }
    }
    /**
     * Decrypts ciphertext using RSA private key with PKCS#1 v1.5 padding.
     *
     * @param enStr Base64-encoded ciphertext
     * @param privateKey Base64-encoded private key
     * @returns Decrypted plaintext string, or null on error
     */
    static decryptByPrivateKey(enStr, privateKey) {
        try {
            const priKey = this.getPrivateKey(privateKey);
            const cipherBuf = Buffer.from(enStr, 'base64');
            const raw = node_crypto_1.default.privateDecrypt({
                key: priKey,
                padding: node_crypto_1.default.constants.RSA_NO_PADDING
            }, cipherBuf);
            const unpadded = pkcs1Unpad(raw);
            return unpadded.toString('utf8');
        }
        catch (e) {
            console.error('decrypt error', e);
            return null;
        }
    }
    /**
     * Segmented encryption for plaintexts longer than 117 bytes.
     */
    static encryptBySegment(publicKey, plainText) {
        try {
            const pubKey = this.getPublicKey(publicKey);
            const plainBytes = Buffer.from(plainText, 'utf8');
            const chunks = [];
            let offset = 0;
            while (offset < plainBytes.length) {
                const end = Math.min(offset + this.MAX_ENCRYPT_BLOCK, plainBytes.length);
                const chunk = plainBytes.subarray(offset, end);
                const encryptedChunk = node_crypto_1.default.publicEncrypt({
                    key: pubKey,
                    padding: node_crypto_1.default.constants.RSA_PKCS1_PADDING
                }, chunk);
                chunks.push(encryptedChunk);
                offset = end;
            }
            return Buffer.concat(chunks).toString('base64');
        }
        catch (e) {
            console.error('encryptBySegment error', e);
            return null;
        }
    }
    /**
     * Segmented decryption for ciphertexts longer than 128 bytes.
     */
    static decryptBySegment(privateKey, encodedText) {
        try {
            const priKey = this.getPrivateKey(privateKey);
            const cipherBytes = Buffer.from(encodedText, 'base64');
            const chunks = [];
            let offset = 0;
            while (offset < cipherBytes.length) {
                const end = Math.min(offset + this.MAX_DECRYPT_BLOCK, cipherBytes.length);
                const chunk = cipherBytes.subarray(offset, end);
                const raw = node_crypto_1.default.privateDecrypt({
                    key: priKey,
                    padding: node_crypto_1.default.constants.RSA_NO_PADDING
                }, chunk);
                const unpadded = pkcs1Unpad(raw);
                chunks.push(unpadded);
                offset = end;
            }
            return Buffer.concat(chunks).toString('utf8');
        }
        catch (e) {
            console.error('decryptBySegment error', e);
            return null;
        }
    }
}
exports.RSAUtils = RSAUtils;
RSAUtils.KEY_ALGORITHM = 'RSA';
RSAUtils.SIGNATURE_ALGORITHM = 'SHA1WithRSA';
RSAUtils.ENCODING = 'utf-8';
RSAUtils.X509 = 'X.509';
// RSA max block sizes for 1024-bit RSA
RSAUtils.MAX_ENCRYPT_BLOCK = 117;
RSAUtils.MAX_DECRYPT_BLOCK = 128;
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
        if (val !== undefined && val !== null && val !== '') {
            parts.push(`${key}=${val}`);
        }
    }
    return parts.join('&');
}
/**
 * Compresses string with GZIP, matching Java's GZIPOutputStream.
 */
function compressGzip(str) {
    return node_zlib_1.default.gzipSync(Buffer.from(str, 'utf8'));
}
/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
function decompressGzip(buf) {
    return node_zlib_1.default.gunzipSync(buf).toString('utf8');
}
