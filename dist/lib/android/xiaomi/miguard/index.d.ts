/**
 * Decompresses GZIP buffer into UTF-8 string.
 */
export declare function decompressGzip(buf: Buffer): string;
/**
 * Builds the canonical sign content string by sorting keys lexicographically
 * (ASCII order, matching Java TreeMap) and formatting as key=value&key=value.
 * Null, undefined, and empty string values are skipped.
 */
export declare function getSignContent(params: Record<string, any>): string;
declare function testEncryptedAndSignature(): void;
export { testEncryptedAndSignature };
