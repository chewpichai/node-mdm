import crypto from 'node:crypto';

export class AESUtils {
  public static readonly KEY_ALGORITHM = 'AES';
  public static readonly ENCODING = 'utf-8';

  /**
   * Generates a random 128-bit AES key as a Base64-encoded string.
   */
  public static generateAESKey(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Encrypts plaintext string using AES-128-ECB with PKCS5/PKCS7 padding.
   *
   * @param content Plaintext string
   * @param key Base64-encoded 128-bit key
   * @returns Base64-encoded ciphertext, or null on failure
   */
  public static encrypt(content: string, key: string): string | null {
    try {
      const bytesKey = Buffer.from(key, 'base64');
      const cipher = crypto.createCipheriv('aes-128-ecb', bytesKey, null);
      const encrypted = Buffer.concat([
        cipher.update(content, 'utf8'),
        cipher.final()
      ]);
      return encrypted.toString('base64');
    } catch (e) {
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
  public static decrypt(content: string, key: string): string | null {
    try {
      const bytesKey = Buffer.from(key, 'base64');
      const decipher = crypto.createDecipheriv('aes-128-ecb', bytesKey, null);
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(content, 'base64')),
        decipher.final()
      ]);
      return decrypted.toString('utf8');
    } catch (e) {
      console.error('decrypt error', e);
      return null;
    }
  }
}
