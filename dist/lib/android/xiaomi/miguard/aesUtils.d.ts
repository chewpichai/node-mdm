export declare class AESUtils {
    static readonly KEY_ALGORITHM = "AES";
    static readonly ENCODING = "utf-8";
    /**
     * Generates a random 128-bit AES key as a Base64-encoded string.
     */
    static generateAESKey(): string;
    /**
     * Encrypts plaintext string using AES-128-ECB with PKCS5/PKCS7 padding.
     *
     * @param content Plaintext string
     * @param key Base64-encoded 128-bit key
     * @returns Base64-encoded ciphertext, or null on failure
     */
    static encrypt(content: string, key: string): string | null;
    /**
     * Decrypts Base64-encoded ciphertext using AES-128-ECB with PKCS5/PKCS7 padding.
     *
     * @param content Base64-encoded ciphertext
     * @param key Base64-encoded 128-bit key
     * @returns Plaintext string, or null on failure
     */
    static decrypt(content: string, key: string): string | null;
}
