export declare function formatLine(...args: unknown[]): string;
export declare function log(...args: unknown[]): void;
export declare function warn(...args: unknown[]): void;
export declare function error(...args: unknown[]): void;
export declare const logger: {
    log: typeof log;
    warn: typeof warn;
    error: typeof error;
    formatLine: typeof formatLine;
};
export default logger;
