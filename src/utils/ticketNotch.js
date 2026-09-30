"use client";

import { useEffect, useRef, useState } from "react";

// Shared "boarding pass" ticket-notch treatment: a fixed divider position, a
// mask that cuts true semicircular notches into the card's top/bottom edges
// at that position, and the dotted divider itself. Established on
// CoreModuleBanner (the EventReg core module card on the Modules/Dashboard
// pages) and reused as-is anywhere else that wants the same card language
// (e.g. the dashboard's welcome header), so the notch position can never
// drift between the two.

// Where the vertical divider sits, as a percentage of the card's width.
export const TICKET_NOTCH_X = "65%";

// Radius (px) of the semicircular notches.
export const TICKET_NOTCH_R = 9;

// True cutouts, like a boarding pass: a mask of two half-height layers, each
// with a transparent semicircle centered on the card edge, so the page shows
// through the notch. (Painting page-colored discs on top instead reads as
// full circles that hang outside the card.)
export const TICKET_NOTCH_MASK = [
  `radial-gradient(circle ${TICKET_NOTCH_R}px at ${TICKET_NOTCH_X} 0, transparent ${TICKET_NOTCH_R}px, #000 ${TICKET_NOTCH_R + 0.5}px) top / 100% 51% no-repeat`,
  `radial-gradient(circle ${TICKET_NOTCH_R}px at ${TICKET_NOTCH_X} 100%, transparent ${TICKET_NOTCH_R}px, #000 ${TICKET_NOTCH_R + 0.5}px) bottom / 100% 51% no-repeat`,
].join(", ");

// The dotted vertical divider's own background, fixed at TICKET_NOTCH_X.
export const TICKET_DIVIDER_BG =
  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.22) 0, rgba(255,255,255,0.22) 5px, transparent 5px, transparent 12px)";

// The grid column split matching TICKET_NOTCH_X, for a two-column card whose
// boundary should land exactly on the divider/notch position.
const notchXNumber = Number(TICKET_NOTCH_X.replace("%", ""));
export const TICKET_GRID_COLUMNS = `${notchXNumber}fr ${100 - notchXNumber}fr`;

// Mobile version of the notches: the layout is stacked, so the dotted divider
// is horizontal and the notches are cut into the LEFT and RIGHT edges at the
// divider's height. That height depends on how the text wraps, so it is
// measured at runtime rather than fixed. Two half-width layers, one per side.
export const mobileTicketNotchMask = (y) =>
  [
    `radial-gradient(circle ${TICKET_NOTCH_R}px at 0 ${y}px, transparent ${TICKET_NOTCH_R}px, #000 ${TICKET_NOTCH_R + 0.5}px) left / 51% 100% no-repeat`,
    `radial-gradient(circle ${TICKET_NOTCH_R}px at 100% ${y}px, transparent ${TICKET_NOTCH_R}px, #000 ${TICKET_NOTCH_R + 0.5}px) right / 51% 100% no-repeat`,
  ].join(", ");

/**
 * Measures where a stacked (mobile) horizontal ticket divider sits, so its
 * side notches can line up with it. Returns refs to attach to the card's
 * content grid and to the divider element itself, plus the measured y
 * (null on desktop, where the divider is hidden and the top/bottom notches
 * are used instead via TICKET_NOTCH_MASK).
 *
 * @param {Array} deps - Extra effect dependencies that should trigger a remeasure (e.g. language)
 */
export function useMobileTicketNotch(deps = []) {
  const gridRef = useRef(null);
  const dividerRef = useRef(null);
  const [mobileNotchY, setMobileNotchY] = useState(null);

  useEffect(() => {
    const grid = gridRef.current;
    const divider = dividerRef.current;
    if (!grid || !divider) return undefined;

    const measure = () => {
      // offsetParent is null while the divider is display:none (md and up).
      if (divider.offsetParent === null) {
        setMobileNotchY(null);
        return;
      }
      // +1 for the card's 1px border, since the mask is measured from its border box.
      setMobileNotchY(divider.offsetTop + divider.offsetHeight / 2 + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { gridRef, dividerRef, mobileNotchY };
}
