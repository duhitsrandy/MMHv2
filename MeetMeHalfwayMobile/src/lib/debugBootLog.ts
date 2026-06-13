const DEBUG_SESSION = '80cad6';
const DEBUG_ENDPOINT =
  'http://127.0.0.1:7892/ingest/c217502d-5ceb-473d-bd5e-da54bd4eb023';

type BootLogData = Record<string, unknown>;

export function debugBootLog(
  hypothesisId: string,
  location: string,
  message: string,
  data?: BootLogData,
  runId = 'pre-fix'
): void {
  const payload = {
    sessionId: DEBUG_SESSION,
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };

  // #region agent log
  console.log(`[MMH_DEBUG ${DEBUG_SESSION}] ${JSON.stringify(payload)}`);
  if (__DEV__) {
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': DEBUG_SESSION,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion
}
