"use client";

// Shared options for every results/sessions page's "Records per page" select.
export const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100, 250, 500];

// Merge a socket-streamed batch of rows into the accumulated list, keyed by
// id (session id, participant id, etc.) so late/stale batches can't produce
// duplicate cards. Used by every game/event-wheel results list.
// `getId` defaults to the session/participant rows' primary id.
export function mergeRowsById(current, batch, getId = (row) => String(row.sessionId || row._id)) {
  const next = new Map();
  for (const row of current) next.set(getId(row), row);
  for (const row of batch || []) {
    const id = getId(row);
    if (id) next.set(id, row);
  }
  return Array.from(next.values());
}