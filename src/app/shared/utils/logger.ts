const isDevelopment = import.meta.env.DEV;

interface Logger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

export const logger: Logger = {
  log: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },
  debug: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  },
};
