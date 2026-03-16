import { Client } from "@heroiclabs/nakama-js";

/**
 * Nakama client configured for urgame.live
 *
 * Configuration:
 * - Server Key: defaultkey
 * - Host: nakama.urgame.live
 * - Port: 443
 * - SSL: true
 */
export const nakamaClient = new Client(
  "defaultkey",
  "nakama.urgame.live",
  "443",
  true
);
