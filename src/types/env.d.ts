declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MDM_ISHALOU_URL: string;
      MDM_ISHALOU_USERNAME: string;
      MDM_ISHALOU_PASSWORD: string;
      MDM_ANDROID_URL: string;
      MDM_ANDROID_USERNAME: string;
      MDM_ANDROID_PASSWORD: string;
    }
  }
}

export {};
