export function logError(requestId: string, error: unknown) {
  console.error(
    JSON.stringify({
      requestId,
      event: 'request_failed',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    }),
  );
}
