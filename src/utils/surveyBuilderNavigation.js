/**
 * Resolve the previous and next tabs for the current SurveyGuru builder tab.
 *
 * @param {Array<{id: string}>} tabs Visible builder tabs in display order.
 * @param {string} currentTabId Currently selected tab identifier.
 * @returns {{previousTabId: string|null, nextTabId: string|null, isLastTab: boolean}}
 */
export function getSurveyBuilderNavigation(tabs, currentTabId) {
  const currentIndex = tabs.findIndex((tab) => tab.id === currentTabId);

  if (currentIndex < 0) {
    return {
      previousTabId: null,
      nextTabId: null,
      isLastTab: false,
    };
  }

  return {
    previousTabId: tabs[currentIndex - 1]?.id || null,
    nextTabId: tabs[currentIndex + 1]?.id || null,
    isLastTab: currentIndex === tabs.length - 1,
  };
}
