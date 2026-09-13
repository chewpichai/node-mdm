import crypto from "crypto";
import zlib from "zlib";
import { PostRequest } from "./postRequest";
import { AESUtils } from "./aesUtils";
import { RSAUtils } from "./rsaUtils";
import { PartnerResponse } from "./partnerResponse";
import { ErrorCode } from "./errorCode";

const PUBLIC_KEY = process.env.MI_GUARD_PUBLIC_KEY;
const PRIVATE_KEY = process.env.MI_GUARD_PRIVATE_KEY;
const MI_PUBLIC_KEY = process.env.MI_GUARD_MI_PUBLIC_KEY;
const MI_PRIVATE_KEY = process.env.MI_GUARD_MI_PRIVATE_KEY;

/**
 * Compresses string with GZIP, matching Java's GZIPOutputStream.
 */
function compressGzip(str: string): Buffer {
  return zlib.gzipSync(Buffer.from(str, "utf8"));
}

/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
export function decompressGzip(buf: Buffer): string {
  return zlib.gunzipSync(buf).toString("utf8");
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
    if (val !== undefined && val !== null && val !== "") {
      parts.push(`${key}=${val}`);
    }
  }

  return parts.join("&");
}

/**
 * Signs parameter map with RSA private key (SHA1WithRSA, URL-safe Base64).
 */
function signByPrivateKey(
  paramsMap: Record<string, string>,
  privateKey: string
): string | null {
  const content = getSignContent(paramsMap);
  return RSAUtils.signByPrivateKey(content, privateKey);
}

/**
 * Decrypts the params field in PostRequest using partner private key.
 */
function partnerDecrypt(
  request: PostRequest,
  partnerPrivateKey: string
): boolean {
  if (!request.key) {
    return false;
  }

  const key = RSAUtils.decryptByPrivateKey(request.key, partnerPrivateKey);
  if (!key) {
    return false;
  }

  const hasData = Boolean(request.params);
  let decrypted: string | null = null;
  if (hasData && request.params) {
    decrypted = AESUtils.decrypt(request.params, key);
  }

  // If payload was compressed, decompress GZIP after AES decryption
  if (decrypted && request.compressed) {
    try {
      decrypted = decompressGzip(Buffer.from(decrypted, "base64"));
    } catch (e) {
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
function decrypt(response: PartnerResponse, mifiPrivateKey: string): boolean {
  if (!response.encrypted) {
    return true;
  }

  if (!response.key) {
    return false;
  }

  const key = RSAUtils.decryptByPrivateKey(response.key, mifiPrivateKey);
  if (!key) {
    response.setCode(ErrorCode.ERROR_DECRYPT.code);
    response.desc = ErrorCode.ERROR_DECRYPT.desc;
    return false;
  }

  const hasData = Boolean(response.data);
  let decrypted: string | null = null;
  if (hasData && response.data) {
    decrypted = AESUtils.decrypt(response.data, key);
  }

  // Set encrypted to false even if failed to decrypt data to avoid decrypting again
  response.encrypted = false;
  response.data = decrypted ?? undefined;

  if (hasData && decrypted === null) {
    response.setCode(ErrorCode.ERROR_DECRYPT.code);
    response.desc = ErrorCode.ERROR_DECRYPT.desc;
    return false;
  }

  return true;
}

function getPostParams(
  appId: string,
  requestId: string,
  method: string,
  params: Record<string, any>,
  compressed: boolean
): Record<string, string> {
  let bizParams = JSON.stringify(params);
  const paramsMap: Record<string, string> = {
    appId,
    requestId,
    method,
  };

  const key = AESUtils.generateAESKey();
  const encryptedKey = RSAUtils.encryptByPublicKey(key, PUBLIC_KEY);
  if (!encryptedKey) {
    throw new Error("Failed to encrypt AES key with partner public key");
  }
  paramsMap["key"] = encryptedKey;
  paramsMap["version"] = "1.0";
  paramsMap["timestamp"] = String(Date.now());

  if (compressed) {
    bizParams = compressGzip(bizParams).toString("base64");
    paramsMap["compressed"] = "true";
  } else {
    paramsMap["compressed"] = "false";
  }

  const encryptedParams = AESUtils.encrypt(bizParams, key);
  if (!encryptedParams) {
    throw new Error("Failed to encrypt params with AES key");
  }
  paramsMap["params"] = encryptedParams;

  const sign = signByPrivateKey(paramsMap, MI_PRIVATE_KEY);
  if (!sign) {
    throw new Error("Failed to generate signature with MiFi private key");
  }
  paramsMap["sign"] = sign;

  return paramsMap;
}

function parseRequest(content: string): string {
  const raw = JSON.parse(content);
  const request = new PostRequest(raw);
  const verified = request.verifySign(MI_PUBLIC_KEY);

  if (verified) {
    partnerDecrypt(request, PRIVATE_KEY);
  } else {
    console.warn("parseRequest signature verification failed!");
  }

  return JSON.stringify(request.toJSON());
}

/**
 * Builds encrypted & signed partner response parameters.
 */
function getResponse(params: Record<string, any>): Record<string, string> {
  const bizParams = JSON.stringify(params);
  const paramsMap: Record<string, string> = {
    success: "true",
    code: "0",
    desc: "成功",
  };

  const key = AESUtils.generateAESKey();
  const encryptedKey = RSAUtils.encryptByPublicKey(key, MI_PUBLIC_KEY);
  if (!encryptedKey) {
    throw new Error("Failed to encrypt AES key with MiFi public key");
  }
  paramsMap["key"] = encryptedKey;
  paramsMap["encrypted"] = "true";
  paramsMap["timestamp"] = String(Date.now());

  const encryptedData = AESUtils.encrypt(bizParams, key);
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
function parseResponse(content: string): string {
  const raw = JSON.parse(content);
  const response = new PartnerResponse(raw);
  const verified = response.verifySign(PUBLIC_KEY);

  if (verified) {
    decrypt(response, MI_PRIVATE_KEY);
  } else {
    console.warn("parseResponse signature verification failed!");
  }

  return JSON.stringify(response.toJSON());
}

function testEncryptedAndSignature(): void {
  const params: Record<string, any> = { openId: "openId" };
  const postParams = getPostParams("123", "123", "test", params, true);
  console.log("postParams : " + JSON.stringify(postParams, null, 2));

  const parsedPostParams = parseRequest(JSON.stringify(postParams));
  console.log("\nparsedPostParams : " + parsedPostParams);

  const responseParams: Record<string, any> = { data: "data" };
  const response = getResponse(responseParams);
  console.log("\nresponse : " + JSON.stringify(response, null, 2));

  const parsedResponse = parseResponse(JSON.stringify(response));
  console.log("\nparsedResponse : " + parsedResponse);
}

async function sendCommand(url: string = ""): Promise<void> {
  if (!url) {
    console.log("testPost skipped: no URL provided.");
    return;
  }

  const params: Record<string, any> = {
    name: "xxx",
    openId: "2.0:4TtXp7WoqYiwpKbLi9GStHqcDhQ=",
    hashCode: "xxx",
  };
  const postParams = getPostParams(
    "1000054",
    "123",
    "mi.user.register.status",
    params,
    false
  );
  const formBody = new URLSearchParams(postParams);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: formBody.toString(),
  });

  const bodyText = await res.text();
  const parsedResponse = parseResponse(bodyText);
  console.log("parsedResponse : " + parsedResponse);
}

export { testEncryptedAndSignature };
