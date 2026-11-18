export declare function queryDevice(imei: string): Promise<{
    found: boolean;
    device: {
        sn: string;
        imei: string;
        imei2: string;
        shipCountry: string;
        goodsInfo: {
            goodsId: number;
            goodsName: string;
            memory: string;
        };
    } | null;
    header: {
        code: string;
        desc: string;
        location: string;
    };
}>;
