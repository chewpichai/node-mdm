import * as crypto from "crypto";

export interface VTrustOpenAPIOptions {
  clientId?: string;
  clientSecret?: string;
  manufacturer?: string;
  aesIv?: string;
  aesKey?: string;
  baseUrl?: string;
}

export interface EnrollParams {
  imei: string;
  lockTime?: number | null;
  lockTimeDelayPeriod?: number;
  warnMsgAfterLocked?: string;
  remindBeforePhoneLock?: number;
  warnMsgBeforeLocked?: string;
  phoneLockRemindUrl?: string;
}

export enum VTrustControlType {
  LOCK = 1,
  UNLOCK = 2,
  SET_LOCK_TIME = 3,
}

export interface VTrustResponse<T = any> {
  code: string;
  message: string;
  data?: T;
}

const BASE_URL = process.env.VIVO_BASE_URL;
const CLIENT_ID = process.env.VIVO_CLIENT_ID;
const CLIENT_SECRET = process.env.VIVO_CLIENT_SECRET;
const MANUFACTURER = process.env.VIVO_MANUFACTURER;
const AES_IV = process.env.VIVO_AES_IV;
const AES_KEY = process.env.VIVO_AES_KEY;

export class VTrustOpenAPI {
  /**
   * Generate headers for request
   */
  public generateHeaders(body: string): Record<string, string> {
    const timestamp = Date.now().toString();
    const transactionId = crypto.randomUUID();
    const signature = crypto
      .createHash("sha256")
      .update(
        transactionId + CLIENT_ID + timestamp + body + CLIENT_SECRET,
        "utf8"
      )
      .digest("hex");

    return {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      "-x-vtrust-transactionId": transactionId,
      "-x-vtrust-clientId": CLIENT_ID,
      "-x-vtrust-timestamp": timestamp,
      "-x-vtrust-signature": signature,
    };
  }

  /**
   * Encrypt request body with AES/GCM
   * Returns base64 string of (nonce + ciphertext + tag)
   */
  public aesEncrypt(data: string): string {
    const key = Buffer.from(AES_KEY, "base64");
    const iv = Buffer.from(AES_IV, "base64");
    const algorithm: crypto.CipherGCMTypes =
      key.length === 16
        ? "aes-128-gcm"
        : key.length === 24
          ? "aes-192-gcm"
          : "aes-256-gcm";

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(data, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, ciphertext, tag]).toString("base64");
  }

  /**
   * Decrypt AES/GCM encrypted base64 string
   */
  public aesDecrypt(encryptedBase64: string): string {
    const key = Buffer.from(AES_KEY, "base64");
    const iv = Buffer.from(AES_IV, "base64");
    const algorithm: crypto.CipherGCMTypes =
      key.length === 16
        ? "aes-128-gcm"
        : key.length === 24
          ? "aes-192-gcm"
          : "aes-256-gcm";

    const buf = Buffer.from(encryptedBase64, "base64");
    const nonce = buf.subarray(0, iv.length);
    const tag = buf.subarray(buf.length - 16);
    const ciphertext = buf.subarray(iv.length, buf.length - 16);

    const decipher = crypto.createDecipheriv(algorithm, key, nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  }

  private async post<T = VTrustResponse>(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const jsonData = JSON.stringify(data);
    const encryptedParam = this.aesEncrypt(jsonData);
    const headers = this.generateHeaders(jsonData);
    const body = new URLSearchParams({ param: encryptedParam }).toString();

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    const resData = (await response.json()) as T;
    return resData;
  }

  /**
   * Enroll a device in VTrust
   *
   * @param imeiOrOptions - Device imei or EnrollParams object
   * @param lockTime - Time at which device should be locked (Epoch & Unix Timestamp in ms, max: 2147483647000)
   * @param lockTimeDelayPeriod - Amount of time in minutes device will re-lock after being unlocked with pin (0 = no re-lock)
   * @param warnMsgAfterLocked - Message shown when device is locked
   * @param remindBeforePhoneLock - Minutes warning notification shown before lockTime
   * @param warnMsgBeforeLocked - Warning message before lockTime
   * @param phoneLockRemindUrl - URL in warning message before lockTime
   */
  public async enroll(options: EnrollParams): Promise<VTrustResponse>;
  public async enroll(
    imei: string,
    lockTime?: number | null,
    lockTimeDelayPeriod?: number,
    warnMsgAfterLocked?: string,
    remindBeforePhoneLock?: number,
    warnMsgBeforeLocked?: string,
    phoneLockRemindUrl?: string
  ): Promise<VTrustResponse>;
  public async enroll(
    imeiOrOptions: string | EnrollParams,
    lockTime?: number | null,
    lockTimeDelayPeriod: number = 0,
    warnMsgAfterLocked: string = "เครื่องถูกล็อคเนื่องจากมียอดค้างชำระ กรุณาชำระยอดค้าง +ค่าปรับ 100 บาท ติดต่อ Line @Srisawadphone",
    remindBeforePhoneLock: number = 1440,
    warnMsgBeforeLocked: string = "เครื่องของท่านกำลังจะถูกล็อค กรุณาชำระยอดค้างโดยด่วน",
    phoneLockRemindUrl: string = ""
  ): Promise<VTrustResponse> {
    let data: Record<string, unknown>;

    if (typeof imeiOrOptions === "object" && imeiOrOptions !== null) {
      data = {
        deviceId: imeiOrOptions.imei,
        lockTimeDelayPeriod: imeiOrOptions.lockTimeDelayPeriod ?? 0,
        warnMsgAfterLocked:
          imeiOrOptions.warnMsgAfterLocked ??
          "เครื่องถูกล็อคเนื่องจากมียอดค้างชำระ กรุณาชำระยอดค้าง +ค่าปรับ 100 บาท ติดต่อ Line @Srisawadphone",
        remindBeforePhoneLock: imeiOrOptions.remindBeforePhoneLock ?? 1440,
        warnMsgBeforeLocked:
          imeiOrOptions.warnMsgBeforeLocked ??
          "เครื่องของท่านกำลังจะถูกล็อค กรุณาชำระยอดค้างโดยด่วน",
        phoneLockRemindUrl: imeiOrOptions.phoneLockRemindUrl ?? "",
      };
      if (
        imeiOrOptions.lockTime !== undefined &&
        imeiOrOptions.lockTime !== null
      ) {
        data.lockTime = imeiOrOptions.lockTime;
      }
    } else {
      data = {
        deviceId: imeiOrOptions,
        lockTimeDelayPeriod,
        warnMsgAfterLocked,
        remindBeforePhoneLock,
        warnMsgBeforeLocked,
        phoneLockRemindUrl,
      };
      if (lockTime !== undefined && lockTime !== null) {
        data.lockTime = lockTime;
      }
    }

    return this.post(`/openapi/v2/${MANUFACTURER}/device/create`, data);
  }

  /**
   * Re-send the auth code to a device
   *
   * @param imei - Device imei
   */
  public async sendAuthCode(imei: string): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/send-auth-code`, {
      deviceId: imei,
    });
  }

  /**
   * Verify the auth code for a device
   *
   * @param imei - Device imei
   * @param authCode - Auth code shown on device
   */
  public async verifyAuthCode(
    imei: string,
    authCode: string
  ): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/verify-auth-code`, {
      deviceId: imei,
      authCode,
    });
  }

  /**
   * Lock/unlock/set the lockTime of a device
   *
   * @param imei - Device imei
   * @param controlType - 1: Lock instantly. 2: Unlock instantly. 3: Set lock timestamp
   * @param lockTime - Device lock timestamp to set (only needed when controlType is 3)
   */
  public async control(
    imei: string,
    controlType: number,
    lockTime?: number | null
  ): Promise<VTrustResponse> {
    const data: Record<string, unknown> = {
      deviceId: imei,
      type: controlType,
    };
    if (controlType === 3 && lockTime !== undefined && lockTime !== null) {
      data.lockTime = lockTime;
    }
    return this.post(`/openapi/v2/${MANUFACTURER}/device/control`, data);
  }

  /**
   * Send a message to a device
   *
   * @param imei - Device imei
   * @param msgTitle - Title of message
   * @param msgContent - Content of message
   */
  public async message(
    imei: string,
    msgTitle: string,
    msgContent: string
  ): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/remind-message`, {
      deviceId: imei,
      msgTitle,
      msgContent,
    });
  }

  /**
   * Query a PIN code to unlock a device
   *
   * @param imei - Device imei
   */
  public async queryUnlockPin(imei: string): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/unlock-pin`, {
      deviceId: imei,
    });
  }

  /**
   * Query a device's state
   *
   * @param imei - Device imei
   */
  public async queryDeviceInfo(
    imei: string
  ): Promise<VTrustResponse<{ status: number }>> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/info`, {
      deviceId: imei,
    });
  }

  /**
   * Release a device from control (not reversible)
   *
   * @param imei - Device imei
   */
  public async completeContract(imei: string): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/complete-contract`, {
      deviceId: imei,
    });
  }

  /**
   * Delete a completed or unauthorized device (not reversible)
   *
   * @param imei - Device imei
   */
  public async delete(imei: string): Promise<VTrustResponse> {
    return this.post(`/openapi/v2/${MANUFACTURER}/device/remove`, {
      deviceId: imei,
    });
  }
}

// Standalone OEM functions compatible with AndroidOEMMDM interface
let defaultClient: VTrustOpenAPI | null = null;

function getClient(): VTrustOpenAPI {
  if (!defaultClient) {
    defaultClient = new VTrustOpenAPI();
  }
  return defaultClient;
}

export async function uploadDevice(imei: string): Promise<number> {
  const data = await getClient().enroll(imei);
  console.log("🚀 ~ uploadDevice ~ data:", data);
  const isSuccess = data.message === "SUCCESS";
  if (isSuccess) return 200;
  return 461;
}

export async function getDeviceStatus(imei: string): Promise<string> {
  const data = await getClient().queryDeviceInfo(imei);
  console.log("🚀 ~ getDeviceStatus ~ data:", data);
  switch (data?.data?.status) {
    case 1:
      return "active";
    case 2:
      return "active";
    case 3:
      return "lock";
    case 4:
      return "locked";
    case 5:
      return "unlocking";
    case 6:
      return "completed";
    case 7:
      return "completing";
    case 8:
      return "activating";
    case 9:
      return "unauthorized";
    default:
      return "unknown";
  }
}

export async function lockDevice(
  imei: string,
  phone: string,
  message: string
): Promise<boolean> {
  const data = await getClient().control(imei, 1);
  console.log("🚀 ~ lockDevice ~ data:", data);
  return data.message === "SUCCESS";
}

export async function unlockDevice(imei: string): Promise<boolean> {
  const data = await getClient().control(imei, 2);
  console.log("🚀 ~ unlockDevice ~ data:", data);
  return data.message === "SUCCESS";
}

export async function sendMessage(
  imei: string,
  phone: string,
  message: string
): Promise<boolean> {
  const data = await getClient().message(imei, phone, message);
  console.log("🚀 ~ sendMessage ~ data:", data);
  return data.message === "SUCCESS";
}

export async function completeDevice(imei: string): Promise<boolean> {
  const data = await getClient().completeContract(imei);
  console.log("🚀 ~ completeDevice ~ data:", data);
  return data.message === "SUCCESS";
}

export default {
  uploadDevice,
  getDeviceStatus,
  lockDevice,
  unlockDevice,
  sendMessage,
  completeDevice,
};
