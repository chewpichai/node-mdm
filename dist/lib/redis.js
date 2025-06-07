"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
const redis_1 = require("redis");
const REDIS_URL = process.env.REDIS_URL;
async function getClient() {
    if (!REDIS_URL)
        throw new Error("REDIS_URL is not defined");
    return await (0, redis_1.createClient)({ url: REDIS_URL })
        .on("error", (err) => console.log("redis_client_error", err))
        .connect();
}
