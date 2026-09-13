import { RSAUtils } from "./rsaUtils";

export interface IPostRequest {
  appId?: string | number;
  requestId?: string | number;
  method?: string;
  params?: string;
  version?: string;
  sign?: string;
  key?: string;
  timestamp?: number | string;
  compressed?: boolean | string;
}

export class PostRequest {
  public appId: string | number = "";
  public requestId: string | number = "";
  public method: string = "";
  public params?: string;
  public version: string = "1.0";
  public sign?: string;
  public key?: string;
  public timestamp?: number;
  public compressed: boolean = false;

  constructor(init?: Partial<PostRequest> | Record<string, any>) {
    if (init) {
      this.appId = init.appId ?? "";
      this.requestId = init.requestId ?? "";
      this.method = init.method ?? "";
      this.params = init.params;
      this.version = init.version ?? "1.0";
      this.sign = init.sign;
      this.key = init.key;
      this.timestamp =
        init.timestamp !== undefined ? Number(init.timestamp) : undefined;
      this.compressed = init.compressed === true || init.compressed === "true";
    }
  }

  /**
   * Verifies the signature of the request against the Xiaomi/MiFi public key.
   */
  public verifySign(publicKey: string): boolean {
    if (!this.sign) {
      return false;
    }

    const map: Record<string, any> = {
      appId: this.appId,
      compressed: this.compressed,
      key: this.key,
      method: this.method,
      requestId: this.requestId,
      version: this.version,
    };

    if (this.timestamp !== undefined && this.timestamp > 0) {
      map.timestamp = this.timestamp;
    }
    if (this.params !== undefined && this.params !== null) {
      map.params = this.params;
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
      appId: this.appId,
      requestId: this.requestId,
      method: this.method,
      version: this.version,
      compressed: this.compressed,
    };
    if (this.params !== undefined) obj.params = this.params;
    if (this.key !== undefined) obj.key = this.key;
    if (this.timestamp !== undefined) obj.timestamp = this.timestamp;
    if (this.sign !== undefined) obj.sign = this.sign;
    return obj;
  }
}
