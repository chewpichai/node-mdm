import crypto from 'node:crypto';
import zlib from 'node:zlib';

function cleanBase64Key(rawKey: string): Buffer {
  const clean = rawKey.replace(/[\r\n\s]/g, '');
  return Buffer.from(clean, 'base64');
}

/**
 * PKCS#1 v1.5 padding removal for RSA encryption block type 02 (public key encryption).
 * Format: 0x00 0x02 [non-zero padding bytes >= 8] 0x00 [data]
 * This allows decrypting with RSA PKCS#1 v1.5 padding in modern Node.js versions (v21+).
 */
function pkcs1Unpad(buf: Buffer): Buffer {
  let idx = 0;
  if (buf[0] === 0x00 && buf[1] === 0x02) {
    idx = 2;
  } else if (buf[0] === 0x02) {
    idx = 1;
  } else {
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

export class RSAUtils {
  public static readonly KEY_ALGORITHM = 'RSA';
  public static readonly SIGNATURE_ALGORITHM = 'SHA1WithRSA';
  public static readonly ENCODING = 'utf-8';
  public static readonly X509 = 'X.509';

  // RSA max block sizes for 1024-bit RSA
  private static readonly MAX_ENCRYPT_BLOCK = 117;
  private static readonly MAX_DECRYPT_BLOCK = 128;

  /**
   * Parses Base64-encoded X.509 SPKI public key.
   */
  public static getPublicKey(key: string): crypto.KeyObject {
    const der = cleanBase64Key(key);
    return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
  }

  /**
   * Parses Base64-encoded PKCS#8 private key.
   */
  public static getPrivateKey(key: string): crypto.KeyObject {
    const der = cleanBase64Key(key);
    return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  }

  /**
   * RSA private key signing using SHA1WithRSA.
   * Output is URL-safe Base64 encoded without padding (matching Apache Commons encodeBase64URLSafe).
   *
   * @param content String to sign
   * @param privateKey Base64-encoded PKCS#8 private key
   * @returns URL-safe Base64 signature string, or null on error
   */
  public static signByPrivateKey(content: string, privateKey: string): string | null {
    try {
      const priKey = this.getPrivateKey(privateKey);
      const signer = crypto.createSign('RSA-SHA1');
      signer.update(content, 'utf8');
      return signer.sign(priKey, 'base64url');
    } catch (e) {
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
  public static verifySignByPublicKey(content: string, sign: string, publicKey: string): boolean {
    try {
      const pubKey = this.getPublicKey(publicKey);
      const verifier = crypto.createVerify('RSA-SHA1');
      verifier.update(content, 'utf8');
      const signBuf = Buffer.from(sign, 'base64url');
      return verifier.verify(pubKey, signBuf);
    } catch (e) {
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
  public static encryptByPublicKey(plainText: string, publicKey: string): string | null {
    try {
      const pubKey = this.getPublicKey(publicKey);
      const encrypted = crypto.publicEncrypt(
        {
          key: pubKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(plainText, 'utf8')
      );
      return encrypted.toString('base64');
    } catch (e) {
      console.error('encrypt error', e);
      return null;
    }
  }

  /**
   * Encrypts plaintext using RSA public key, returns URL-safe Base64 string.
   */
  public static encryptURLSafeByPublicKey(plainText: string, publicKey: string): string | null {
    try {
      const pubKey = this.getPublicKey(publicKey);
      const encrypted = crypto.publicEncrypt(
        {
          key: pubKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(plainText, 'utf8')
      );
      return encrypted.toString('base64url');
    } catch (e) {
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
  public static decryptByPrivateKey(enStr: string, privateKey: string): string | null {
    try {
      const priKey = this.getPrivateKey(privateKey);
      const cipherBuf = Buffer.from(enStr, 'base64');
      const raw = crypto.privateDecrypt(
        {
          key: priKey,
          padding: crypto.constants.RSA_NO_PADDING
        },
        cipherBuf
      );
      const unpadded = pkcs1Unpad(raw);
      return unpadded.toString('utf8');
    } catch (e) {
      console.error('decrypt error', e);
      return null;
    }
  }

  /**
   * Segmented encryption for plaintexts longer than 117 bytes.
   */
  public static encryptBySegment(publicKey: string, plainText: string): string | null {
    try {
      const pubKey = this.getPublicKey(publicKey);
      const plainBytes = Buffer.from(plainText, 'utf8');
      const chunks: Buffer[] = [];
      let offset = 0;

      while (offset < plainBytes.length) {
        const end = Math.min(offset + this.MAX_ENCRYPT_BLOCK, plainBytes.length);
        const chunk = plainBytes.subarray(offset, end);
        const encryptedChunk = crypto.publicEncrypt(
          {
            key: pubKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
          },
          chunk
        );
        chunks.push(encryptedChunk);
        offset = end;
      }

      return Buffer.concat(chunks).toString('base64');
    } catch (e) {
      console.error('encryptBySegment error', e);
      return null;
    }
  }

  /**
   * Segmented decryption for ciphertexts longer than 128 bytes.
   */
  public static decryptBySegment(privateKey: string, encodedText: string): string | null {
    try {
      const priKey = this.getPrivateKey(privateKey);
      const cipherBytes = Buffer.from(encodedText, 'base64');
      const chunks: Buffer[] = [];
      let offset = 0;

      while (offset < cipherBytes.length) {
        const end = Math.min(offset + this.MAX_DECRYPT_BLOCK, cipherBytes.length);
        const chunk = cipherBytes.subarray(offset, end);
        const raw = crypto.privateDecrypt(
          {
            key: priKey,
            padding: crypto.constants.RSA_NO_PADDING
          },
          chunk
        );
        const unpadded = pkcs1Unpad(raw);
        chunks.push(unpadded);
        offset = end;
      }

      return Buffer.concat(chunks).toString('utf8');
    } catch (e) {
      console.error('decryptBySegment error', e);
      return null;
    }
  }
}

/**
 * Builds the canonical sign content string by sorting keys lexicographically
 * (ASCII order, matching Java TreeMap) and formatting as key=value&key=value.
 * Null, undefined, and empty string values are skipped.
 */
export function getSignContent(params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort();
  const parts: string[] = [];

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
export function compressGzip(str: string): Buffer {
  return zlib.gzipSync(Buffer.from(str, 'utf8'));
}

/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
export function decompressGzip(buf: Buffer): string {
  return zlib.gunzipSync(buf).toString('utf8');
}
