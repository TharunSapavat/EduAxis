const DEFAULT_SLOW_QUERY_MS = 150;

const toSafeJSON = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
};

export const configureMongoQueryProfiler = (connection) => {
  const thresholdMs = Number(process.env.SLOW_QUERY_MS || DEFAULT_SLOW_QUERY_MS);
  const enableProfiler = process.env.ENABLE_DB_PROFILING !== 'false';

  if (!enableProfiler || !connection?.getClient) {
    return;
  }

  const client = connection.getClient();
  const inFlight = new Map();

  client.on('commandStarted', (event) => {
    inFlight.set(event.requestId, {
      commandName: event.commandName,
      command: event.command,
      startedAt: Date.now()
    });
  });

  client.on('commandSucceeded', (event) => {
    const started = inFlight.get(event.requestId);
    inFlight.delete(event.requestId);

    const driverElapsedMs = Number(event.duration || 0) / 1000;
    const fallbackElapsedMs = started?.startedAt ? (Date.now() - started.startedAt) : 0;
    const elapsedMs = driverElapsedMs > 0 ? driverElapsedMs : fallbackElapsedMs;
    if (elapsedMs < thresholdMs) {
      return;
    }

    console.warn(`[SLOW-QUERY] ${started?.commandName || event.commandName} took ${elapsedMs.toFixed(2)}ms`, {
      command: toSafeJSON(started?.command),
      reply: toSafeJSON(event.reply)
    });
  });

  client.on('commandFailed', (event) => {
    inFlight.delete(event.requestId);
  });
};
