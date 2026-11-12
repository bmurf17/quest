/**
 * Small logging facade.
 *
 * Debug/info output is only emitted when `VITE_DEBUG_MODE=true`, so shipping
 * builds stay quiet. Warnings and errors are always emitted because they
 * indicate something the player or developer may need to act on.
 */
const debugEnabled = import.meta.env.VITE_DEBUG_MODE === "true";

const prefix = "[quest]";

export const logger = {
  debug: (...args: unknown[]) => {
    if (debugEnabled) {
      console.debug(prefix, ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (debugEnabled) {
      console.info(prefix, ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn(prefix, ...args);
  },
  error: (...args: unknown[]) => {
    console.error(prefix, ...args);
  },
};
