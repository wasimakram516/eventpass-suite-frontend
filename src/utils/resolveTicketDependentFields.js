/**
 * Resolves which dependent-field definitions apply to a given ticket type,
 * mirroring the backend's src/utils/resolveTicketDependentFields.js.
 *
 * The mapping is keyed by ticketType._id (stable) going forward, but events
 * saved before this existed still have it keyed by ticketType.name — and a
 * field's own identity in that list is its inputName, which breaks the same
 * way if the field is ever renamed. Both are matched here (ID first, name as
 * a fallback for anything not yet re-saved under the new scheme) so renaming
 * a ticket or a dependent field's label never silently detaches it from the
 * ticket it belongs to.
 *
 * @param {object} event - Event object with globalDependentFields /
 *   globalDependentFieldMappings.
 * @param {object|null|undefined} ticketType - A ticketTypes[] entry, or
 *   nullish if there is no selected ticket.
 * @returns {Array<object>} Field definitions applicable to this ticket.
 */
export default function resolveTicketDependentFields(event, ticketType) {
  if (!ticketType) return [];
  const mappings = event?.globalDependentFieldMappings || {};

  const ticketId = ticketType._id != null ? String(ticketType._id) : null;
  const ticketName = ticketType.name != null ? String(ticketType.name).trim() : null;

  const mappedById = ticketId && Object.prototype.hasOwnProperty.call(mappings, ticketId)
    ? mappings[ticketId]
    : null;
  const mappedByName = ticketName
    ? mappings[ticketName] ?? Object.entries(mappings).find(([k]) => String(k).trim() === ticketName)?.[1]
    : null;

  const mappedIdentifiers = new Set(
    [...(mappedById || []), ...(mappedByName || [])].map((v) => String(v).trim()),
  );
  if (mappedIdentifiers.size === 0) return [];

  return (event?.globalDependentFields || []).filter(
    (f) =>
      (f._id != null && mappedIdentifiers.has(String(f._id))) ||
      (f.inputName != null && mappedIdentifiers.has(String(f.inputName).trim())),
  );
}
