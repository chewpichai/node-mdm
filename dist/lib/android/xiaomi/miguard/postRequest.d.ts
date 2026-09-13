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
export declare class PostRequest {
    appId: string | number;
    requestId: string | number;
    method: string;
    params?: string;
    version: string;
    sign?: string;
    key?: string;
    timestamp?: number;
    compressed: boolean;
    constructor(init?: Partial<PostRequest> | Record<string, any>);
    /**
     * Verifies the signature of the request against the Xiaomi/MiFi public key.
     */
    verifySign(publicKey: string): boolean;
    toJSON(): Record<string, any>;
}
