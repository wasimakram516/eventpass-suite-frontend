// Module catalog routes point at the historical landing pages. CMS entry
// points should take users straight to the page where they can work.
const MODULE_WORKING_ROUTES = {
  eventreg: "/cms/modules/eventreg/events",
  checkin: "/cms/modules/checkin/events",
  checkout: "/cms/modules/checkout/events",
  digipass: "/cms/modules/digipass/events",
  eventwheel: "/cms/modules/eventwheel/wheels",
  memorywall: "/cms/modules/memorywall/walls",
  quiznest: "/cms/modules/quiznest/games",
  tapmatch: "/cms/modules/tapmatch/games",
  crosszero: "/cms/modules/crosszero/games",
  eventduel: "/cms/modules/eventduel/games",
  stageq: "/cms/modules/stageq/sessions",
  surveyguru: "/cms/modules/surveyguru/surveys",
  votecast: "/cms/modules/votecast/polls",
};

export const getModuleWorkingRoute = (module) => {
  const moduleKey = typeof module?.key === "string"
    ? module.key.toLowerCase()
    : module?.key;

  return MODULE_WORKING_ROUTES[moduleKey] || module?.route;
};
