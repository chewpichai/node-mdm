import crypto from "crypto";

const CLIENT_SECRET = process.env.OPPO_CLIENT_SECRET;
const CARRIER_CODE = process.env.OPPO_CARRIER_CODE;
const TOKEN = process.env.OPPO_TOKEN;

function possefySign(body: string) {
  const timestamp = new Date(Date.now() + 7 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
  const signature = crypto
    .createHmac("sha256", CLIENT_SECRET)
    .update(body + timestamp)
    .digest("base64");

  return { timestamp, signature };
}

function oGuardSign(body: string): string {
  const dataToSign = `${body},${CARRIER_CODE},${TOKEN}`;
  return crypto
    .createHash("sha256")
    .update(dataToSign, "utf8")
    .digest("base64");
}

export { possefySign, oGuardSign };
