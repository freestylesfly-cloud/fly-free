import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

const logger = new Logger("JwtSecret");

/**
 * Every token in the system is signed and verified with this value.
 *
 * There is deliberately no default. The previous fallback ("dev-secret-key")
 * is a literal in a public repository, so any environment missing JWT_SECRET
 * was issuing tokens that anyone could forge - including admin tokens.
 */
export function requireJwtSecret(config?: ConfigService): string {
  const secret = (config?.get<string>("JWT_SECRET") || process.env.JWT_SECRET || "").trim();

  if (!secret) {
    logger.error("JWT_SECRET is not set. Tokens cannot be issued or verified.");
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

/** Logs once at boot so a missing secret is obvious before the first request. */
export function warnIfJwtSecretMissing(config?: ConfigService) {
  const secret = (config?.get<string>("JWT_SECRET") || process.env.JWT_SECRET || "").trim();

  if (!secret) {
    logger.error(
      "JWT_SECRET is not set. Every login and every authenticated request will fail until it is configured."
    );
  } else if (secret.length < 32) {
    logger.warn(`JWT_SECRET is only ${secret.length} characters. Use at least 32 random characters.`);
  }
}
