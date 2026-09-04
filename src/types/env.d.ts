declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MDM_CHEWLABX_URL: string;
      MDM_CHEWLABX_USERNAME: string;
      MDM_CHEWLABX_PASSWORD: string;
      MDM_ISHALOU_URL: string;
      MDM_ISHALOU_USERNAME: string;
      MDM_ISHALOU_PASSWORD: string;
      MDM_MDMLOCKPHONE_URL: string;
      MDM_MDMLOCKPHONE_APPID: string;
      MDM_MDMLOCKPHONE_APPSECRET: string;
      MDM_ANDROID_URL: string;
      MDM_ANDROID_USERNAME: string;
      MDM_ANDROID_PASSWORD: string;
      MDM_SEEKDREAM_USERNAME: string;
      MDM_SEEKDREAM_URL: string;
      MDM_SEEKDREAM_PASSWORD: string;
      MDM_SEEKDREAM_API_KEY: string;
      MDM_SEEKDREAM_ROLE: "agent" | "mch" | "staff";
      REALME_CARRIER_CODE: string;
      REALME_TOKEN: string;
      INFINIX_API_KEY: string;
      XIAOMI_API_KEY: string;
      XIAOMI_TENANT_ID: string;
      VIVO_CLIENT_ID: string;
      VIVO_CLIENT_SECRET: string;
      VIVO_MANUFACTURER: string;
      VIVO_AES_IV: string;
      VIVO_AES_KEY: string;
      VIVO_BASE_URL: string;
    }
  }
}

export {};
