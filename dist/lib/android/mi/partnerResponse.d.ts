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
export declare class PartnerResponse {
    success: boolean;
    code: number;
    desc: string;
    encrypted: boolean;
    data?: string;
    key?: string;
    timestamp?: number;
    sign?: string;
    constructor(init?: Partial<PartnerResponse> | Record<string, any>);
    setCode(code: number): void;
    /**
     * Verifies the signature of the response against the partner public key.
     */
    verifySign(publicKey: string): boolean;
    toJSON(): Record<string, any>;
}
