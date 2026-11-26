import { RSAUtils } from "./rsaUtils";
import { ErrorCode } from "./errorCode";

export interface IPartnerResponse {
  success?: boolean;
  code?: number;
  desc?: string;
  encrypted?: boolean;
  data?: string;
  key?: string;
  timestamp?: number | string;
  sign?: string;
}

export class PartnerResponse {
  public success: boolean = false;
  public code: number = 0;
  public desc: string = "";
  public encrypted: boolean = false;
  public data?: string;
  public key?: string;
  public timestamp?: number;
  public sign?: string;

  constructor(init?: Partial<PartnerResponse> | Record<string, any>) {
    if (init) {
      this.success = init.success === true || init.success === "true";
      this.code = init.code !== undefined ? Number(init.code) : 0;
      this.desc = init.desc || "";
      this.encrypted = init.encrypted === true || init.encrypted === "true";
      this.data = init.data;
      this.key = init.key;
      this.timestamp =
        init.timestamp !== undefined ? Number(init.timestamp) : undefined;
      this.sign = init.sign;

      if (this.code !== ErrorCode.SUCCESS.code) {
        this.success = false;
      }
    }
  }

  public setCode(code: number): void {
    this.code = code;
    if (code !== ErrorCode.SUCCESS.code) {
      this.success = false;
    }
  }

  /**
   * Verifies the signature of the response against the partner public key.
   */
  public verifySign(publicKey: string): boolean {
    if (!this.sign) {
      return false;
    }

    const map: Record<string, any> = {
      code: this.code,
      encrypted: this.encrypted,
      success: this.success,
    };

    if (this.data !== undefined && this.data !== null) {
      map.data = this.data;
    }
    if (this.desc !== undefined && this.desc !== null && this.desc !== "") {
      map.desc = this.desc;
    }
    if (this.key !== undefined && this.key !== null) {
      map.key = this.key;
    }
    if (this.timestamp !== undefined && this.timestamp > 0) {
      map.timestamp = this.timestamp;
    }

    const sortedKeys = Object.keys(map).sort();
    const parts: string[] = [];
    for (const k of sortedKeys) {
      parts.push(`${k}=${map[k]}`);
    }

    const content = parts.join("&");
    return RSAUtils.verifySignByPublicKey(content, this.sign, publicKey);
  }

  public toJSON(): Record<string, any> {
    const obj: Record<string, any> = {
      success: this.success,
      code: this.code,
      desc: this.desc,
      encrypted: this.encrypted,
    };
    if (this.data !== undefined) obj.data = this.data;
    if (this.key !== undefined) obj.key = this.key;
    if (this.timestamp !== undefined) obj.timestamp = this.timestamp;
    if (this.sign !== undefined) obj.sign = this.sign;
    return obj;
  }
}
