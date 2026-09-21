import dayjs from "dayjs";
import zlib from "zlib";
import { MDMAndroidOEMDevice } from "../../../../types";
import { AESUtils } from "./aesUtils";
import { ErrorCode } from "./errorCode";
import { PartnerResponse } from "./partnerResponse";
import { PostRequest } from "./postRequest";
import { RSAUtils } from "./rsaUtils";

const APP_ID = process.env.MI_GUARD_APP_ID;
const ORG_NO = process.env.MI_GUARD_ORG_NO;
const PUBLIC_KEY = process.env.MI_GUARD_PUBLIC_KEY;
const PRIVATE_KEY = process.env.MI_GUARD_PRIVATE_KEY;
const MI_PUBLIC_KEY = process.env.MI_GUARD_MI_PUBLIC_KEY;
type FinancialStatus =
  | "unknown"
  | "register"
  | "active"
  | "locked"
  | "released";

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
function decrypt(response: PartnerResponse, privateKey: string): boolean {
  if (!response.encrypted) {
    return true;
  }

  if (!response.key) {
    return false;
  }

  const key = RSAUtils.decryptByPrivateKey(response.key, privateKey);
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
  const encryptedKey = RSAUtils.encryptByPublicKey(key, MI_PUBLIC_KEY);
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

  const sign = signByPrivateKey(paramsMap, PRIVATE_KEY);
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
  const encryptedKey = RSAUtils.encryptByPublicKey(key, PUBLIC_KEY);
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
function parseResponse(content: string) {
  const raw = JSON.parse(content);
  const response = new PartnerResponse(raw);
  const verified = response.verifySign(MI_PUBLIC_KEY);

  if (verified) {
    decrypt(response, PRIVATE_KEY);
  } else {
    console.warn("parseResponse signature verification failed!");
  }

  return response.toJSON() as {
    success: boolean;
    code: number;
    desc: string;
    encrypted: boolean;
    key: string;
    timestamp: number;
    sign: string;
    data: string;
  };
}

async function sendCommand<T>(
  method: string,
  params: Record<string, any>
): Promise<T> {
  const postParams = getPostParams(APP_ID, "123", method, params, false);
  const url = "https://staging-merchant-api.ginstal.xiaomi.com/v1/partner";
  const formBody = new URLSearchParams(postParams);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: formBody.toString(),
  });
  const bodyText = await res.text();
  console.log("🚀 ~ sendCommand ~ bodyText:", bodyText);
  const parsedResponse = parseResponse(bodyText);
  console.log("parsedResponse : " + JSON.stringify(parsedResponse));
  return JSON.parse(parsedResponse.data);
}

async function uploadDevice(imei: string): Promise<void> {
  const data = await sendCommand<{ code: number; msg: string }>(
    "mi.lock.device.register",
    {
      financialOrgNo: ORG_NO,
      deviceRegisterNo: imei,
    }
  );
  console.log("🚀 ~ uploadDevice ~ data:", data);
}

async function getDevice(
  imei: string
): Promise<MDMAndroidOEMDevice | undefined> {
  const data = await sendCommand<{
    code: number;
    msg: string;
    content: { financialStatus: FinancialStatus; lastContractTime: number };
  }>("mi.lock.device.status", {
    financialOrgNo: ORG_NO,
    deviceRegisterNo: imei,
  });
  console.log("🚀 ~ getDevice ~ data:", data);
  return {
    id: imei,
    status: getDeviceStatus(data.content.financialStatus),
    modelName: "",
    createTime: "",
    lastOnlineTime: dayjs(data.content.lastContractTime).format(
      "YYYYMMDDHHmmss"
    ),
  };
}

function getDeviceStatus(status: FinancialStatus) {
  switch (status) {
    case "register":
      return "activating";
    case "released":
      return "completed";
    default:
      return status;
  }
}

async function lockDevice(imei: string, phone: string, message: string) {
  const data = await sendCommand<{ code: number; msg: string }>(
    "mi.lock.device.policy.send",
    {
      financialOrgNo: ORG_NO,
      deviceRegisterNo: imei,
      policyNo: "lock",
      title: phone,
      content: message,
    }
  );
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.msg === "success";
}

async function unlockDevice(imei: string) {
  const data = await sendCommand<{ code: number; msg: string }>(
    "mi.lock.device.policy.send",
    {
      financialOrgNo: ORG_NO,
      deviceRegisterNo: imei,
      policyNo: "unlock",
    }
  );
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.msg === "success";
}

async function sendMessage(imei: string, phone: string, message: string) {
  const data = await sendCommand<{ code: number; msg: string }>(
    "mi.lock.device.policy.send",
    {
      financialOrgNo: ORG_NO,
      deviceRegisterNo: imei,
      policyNo: "pop_notify",
      title: phone,
      content: message,
    }
  );
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data.msg === "success";
}

async function completeDevice(imei: string) {
  const data = await sendCommand<{ code: number; msg: string }>(
    "mi.lock.device.policy.send",
    {
      financialOrgNo: ORG_NO,
      deviceRegisterNo: imei,
      policyNo: "release",
    }
  );
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data.msg === "success";
}

export default {
  uploadDevice,
  getDevice,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
