export declare class ParamErrorException extends Error {
    constructor(message: string);
}
export declare function getSign(requestBody: string, carrierCode: string, token: string): string;
