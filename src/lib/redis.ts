import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;

export async function getClient() {
  if (!REDIS_URL) throw new Error("REDIS_URL is not defined");

  return await createClient({ url: REDIS_URL })
    .on("error", (error) => console.error(error))
    .connect();
}
