declare function possefySign(body: string): {
    timestamp: string;
    signature: string;
};
declare function oGuardSign(body: string): string;
export { possefySign, oGuardSign };
