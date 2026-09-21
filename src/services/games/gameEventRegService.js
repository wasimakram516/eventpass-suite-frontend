// Derives a game's EventReg link config from its (populated) payload, as
// returned by each module's getGameBySlug. Returns null when the game is not
// linked to an EventReg event.
export const getGameLinkConfig = (game) => {
  if (!game?.linkedEventRegId || !game?.primaryField) return null;

  const linked = game.linkedEventRegId;
  const event = linked?._id ? linked : null;
  if (!event || !event._id) return null;

  const formField = Array.isArray(event.formFields)
    ? event.formFields.find((f) => f.inputName === game.primaryField)
    : null;

  const rawLabel = game.primaryField === "fullName"
    ? "Full Name"
    : (formField?.inputName || game.primaryField || "");
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return {
    eventId: event._id,
    primaryField: game.primaryField,
    primaryFieldLabel: label,
    primaryInputType: formField?.inputType || "text",
  };
};

export const buildPrimaryPayload = (payload, primaryValue) => ({
  ...payload,
  primaryValue,
});

export const buildRemainingPayload = (payload, primaryValue, remainingValues) => ({
  ...payload,
  primaryValue,
  remainingValues,
});