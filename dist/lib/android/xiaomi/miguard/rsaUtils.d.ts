import crypto from 'node:crypto';
export declare class RSAUtils {
    static readonly KEY_ALGORITHM = "RSA";
    static readonly SIGNATURE_ALGORITHM = "SHA1WithRSA";
    static readonly ENCODING = "utf-8";
    static readonly X509 = "X.509";
    private static readonly MAX_ENCRYPT_BLOCK;
    private static readonly MAX_DECRYPT_BLOCK;
    /**
     * Parses Base64-encoded X.509 SPKI public key.
     */
    static getPublicKey(key: string): crypto.KeyObject;
    /**
     * Parses Base64-encoded PKCS#8 private key.
     */
    static getPrivateKey(key: string): crypto.KeyObject;
    /**
     * RSA private key signing using SHA1WithRSA.
     * Output is URL-safe Base64 encoded without padding (matching Apache Commons encodeBase64URLSafe).
     *
     * @param content String to sign
     * @param privateKey Base64-encoded PKCS#8 private key
     * @returns URL-safe Base64 signature string, or null on error
     */
    static signByPrivateKey(content: string, privateKey: string): string | null;
    /**
     * RSA public key signature verification for SHA1WithRSA.
     * Accepts both standard and URL-safe Base64 signatures.
     *
     * @param content String that was signed
     * @param sign Base64 or URL-safe Base64 signature
     * @param publicKey Base64-encoded X.509 SPKI public key
     * @returns true if valid, false otherwise
     */
    static verifySignByPublicKey(content: string, sign: string, publicKey: string): boolean;
    /**
     * Encrypts plaintext using RSA public key with PKCS#1 v1.5 padding.
     *
     * @param plainText Plaintext to encrypt
     * @param publicKey Base64-encoded public key
     * @returns Standard Base64-encoded ciphertext, or null on error
     */
    static encryptByPublicKey(plainText: string, publicKey: string): string | null;
    /**
     * Encrypts plaintext using RSA public key, returns URL-safe Base64 string.
     */
    static encryptURLSafeByPublicKey(plainText: string, publicKey: string): string | null;
    /**
     * Decrypts ciphertext using RSA private key with PKCS#1 v1.5 padding.
     *
     * @param enStr Base64-encoded ciphertext
     * @param privateKey Base64-encoded private key
     * @returns Decrypted plaintext string, or null on error
     */
    static decryptByPrivateKey(enStr: string, privateKey: string): string | null;
    /**
     * Segmented encryption for plaintexts longer than 117 bytes.
     */
    static encryptBySegment(publicKey: string, plainText: string): string | null;
    /**
     * Segmented decryption for ciphertexts longer than 128 bytes.
     */
    static decryptBySegment(privateKey: string, encodedText: string): string | null;
}
/**
 * Builds the canonical sign content string by sorting keys lexicographically
 * (ASCII order, matching Java TreeMap) and formatting as key=value&key=value.
 * Null, undefined, and empty string values are skipped.
 */
export declare function getSignContent(params: Record<string, any>): string;
/**
 * Compresses string with GZIP, matching Java's GZIPOutputStream.
 */
export declare function compressGzip(str: string): Buffer;
/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
export declare function decompressGzip(buf: Buffer): string;
