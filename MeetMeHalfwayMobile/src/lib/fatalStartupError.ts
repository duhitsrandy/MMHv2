export type FatalStartupError = {
  message: string;
  stack?: string;
  name?: string;
};

let fatalError: FatalStartupError | null = null;
const listeners = new Set<() => void>();

function normalizeError(error: unknown): FatalStartupError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: typeof error === 'string' ? error : String(error),
  };
}

export function captureFatalStartupError(error: unknown): void {
  fatalError = normalizeError(error);
  for (const listener of listeners) {
    listener();
  }
}

export function getFatalStartupError(): FatalStartupError | null {
  return fatalError;
}

export function subscribeFatalStartupError(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Chain after expo-router/entry so we run after RN's default ErrorUtils handler is installed. */
export function wrapGlobalErrorHandler(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ErrorUtils = require('react-native/Libraries/vendor/core/ErrorUtils').default as {
    getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
    setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  };

  const previous = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (isFatal && !__DEV__) {
      captureFatalStartupError(error);
    }
    previous(error, !!isFatal);
  });
}
