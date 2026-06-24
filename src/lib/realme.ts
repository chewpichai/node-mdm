import * as crypto from "crypto";

export class ParamErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParamErrorException";
  }
}

function isEmpty(data: string | null | undefined): boolean {
  return data === null || data === undefined || data === "";
}

export function getSign(
  requestBody: string,
  carrierCode: string,
  token: string
): string {
  if (isEmpty(requestBody))
    throw new ParamErrorException("requestBody is empty");

  if (isEmpty(carrierCode))
    throw new ParamErrorException("carrierCode is empty");

  if (isEmpty(token)) throw new ParamErrorException("token is empty");

  const dataToSign = `${requestBody},${carrierCode},${token}`;
  return crypto
    .createHash("sha256")
    .update(dataToSign, "utf8")
    .digest("base64");
}
