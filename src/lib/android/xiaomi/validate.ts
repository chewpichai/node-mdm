import crypto from "crypto";

const APP_ID = process.env.MI_APP_ID;
const APP_KEY = process.env.MI_APP_KEY;
const ENDPOINT =
  "https://sgp-xmmionegw-outer.be.mi.com/mtop/orderfulfill/open/device/imei/query";

const ERROR_HINTS = {
  "415000002": "Parameter error: check imei/sn format and length.",
  "5100":
    "Signature failed: check the key and that the signed body matches the sent body.",
  "1000006":
    "Third-party service failed: record desc/location and contact R&D.",
  "1002009": "Remote connection error: retry, then contact R&D if it persists.",
  "515000001": "Unknown error: record the response and contact R&D.",
};

/** Validate and normalise inputs per the API's constraint rules. */
function buildBusinessBody(imei: string) {
  imei = (imei || "").trim();

  if (!imei) throw new Error("imei and sn cannot both be empty");
  if (imei && !/^\d{15}$/.test(imei))
    throw new Error("imei must be exactly 15 digits");

  const payload: { imei?: string } = {};
  if (imei) payload.imei = imei;
  return JSON.stringify(payload);
}

/** sign = MD5(appid + body + key).toUpperCase() */
function sign(bodyStr: string) {
  return crypto
    .createHash("md5")
    .update(APP_ID + bodyStr + APP_KEY, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Build the Base64 X5 message. `body` must be a STRING, not a nested object. */
function buildData(bodyStr: string) {
  const x5 = {
    header: { appid: APP_ID, sign: sign(bodyStr) },
    body: bodyStr,
  };
  return Buffer.from(JSON.stringify(x5), "utf8").toString("base64");
}

export async function queryDevice(imei: string): Promise<{
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
  header: { code: string; desc: string; location: string };
}> {
  const bodyStr = buildBusinessBody(imei);
  const data = buildData(bodyStr);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data }).toString(),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const json = await res.json();
  const { header = {}, body } = json;

  if (String(header.code) !== "200") {
    const hint = ERROR_HINTS[header.code as keyof typeof ERROR_HINTS] || "";
    throw new Error(`API error ${header.code}: ${header.desc} ${hint}`.trim());
  }

  // Empty object / empty string body on code 200 means "device not found"
  const found =
    body && typeof body === "object" && Object.keys(body).length > 0;
  return { found: Boolean(found), device: found ? body : null, header };
}
