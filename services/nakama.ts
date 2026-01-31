import { Client } from "@heroiclabs/nakama-js";

// Basic configuration for the Nakama client
// These values should ideally come from environment variables in a real app
const CONFIG = {
    host: "127.0.0.1",
    port: "7350",
    useSSL: false,
    timeout: 7000, // Timeout in ms
};

/**
 * The Nakama Client instance.
 * references: https://heroiclabs.com/docs/nakama/client-libraries/javascript/
 */
export const client = new Client(
    "defaultkey", // Server key
    CONFIG.host,
    CONFIG.port,
    CONFIG.useSSL,
    CONFIG.timeout
);
