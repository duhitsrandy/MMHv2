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

/**
 * Patch RN's exception pipeline before expo-router loads route modules (which can
 * throw during evaluation, before ErrorUtils is re-wrapped).
 */
export function installEarlyFatalCapture(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExceptionsManager = require('react-native/Libraries/Core/ExceptionsManager')
    .default as {
    handleException: (error: unknown, isFatal: boolean) => void;
  };

  const previous = ExceptionsManager.handleException.bind(ExceptionsManager);

  ExceptionsManager.handleException = (error: unknown, isFatal: boolean) => {
    if (isFatal && !__DEV__) {
      captureFatalStartupError(error);
      return;
    }
    previous(error, isFatal);
  };
}

/**
 * After expo-router/entry installs RN's handler, replace it so production fatals
 * are captured and NOT forwarded to RCTFatal (which aborts before UI can render).
 */
export function installProductionFatalHandler(): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ErrorUtils = require('react-native/Libraries/vendor/core/ErrorUtils').default as {
    getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
    setGlobalHandler: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  };

  const previous = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (isFatal && !__DEV__) {
      captureFatalStartupError(error);
      return;
    }
    previous(error, !!isFatal);
  });
}

/** @deprecated Use installProductionFatalHandler */
export function wrapGlobalErrorHandler(): void {
  installProductionFatalHandler();
}
