/**
 * DOM helpers for the rich text editor's font size control. They work on a
 * selection Range and only ever touch the text the range covers, so changing
 * the size of some text can never change any other text.
 *
 * These use the browser's Range and Node APIs, so they run in the browser (the
 * editor) and are exercised in a real browser, not in Node.
 */

import { clampSize } from "./clampSize.js";

export const ZERO_WIDTH_SPACE = "​";

export const FONT_SIZE_LIMITS = Object.freeze({ MIN: 8, MAX: 100, DEFAULT: 14 });

/**
 * Clamp a font size to the supported range, falling back to the default.
 *
 * @param {*} value - Candidate size in pixels (number or numeric string)
 * @returns {number} Integer size between MIN and MAX
 */
export function clampFontSize(value) {
  return clampSize(value, {
    min: FONT_SIZE_LIMITS.MIN,
    max: FONT_SIZE_LIMITS.MAX,
    fallback: FONT_SIZE_LIMITS.DEFAULT,
  });
}

/**
 * Split the text nodes at the ends of a range so the range starts and ends on
 * whole text nodes. The range is updated to cover exactly the selected text.
 *
 * @param {Range} range - The selection range; modified in place
 * @returns {void}
 */
function splitRangeBoundaries(range) {
  const { startContainer, startOffset, endContainer, endOffset } = range;
  const isTextEnd = endContainer.nodeType === Node.TEXT_NODE;
  const isTextStart = startContainer.nodeType === Node.TEXT_NODE;

  if (isTextEnd && endOffset < endContainer.length) {
    endContainer.splitText(endOffset);
  }
  if (isTextStart && startOffset > 0) {
    const selected = startContainer.splitText(startOffset);
    range.setStart(selected, 0);
    if (startContainer === endContainer) {
      range.setEnd(selected, endOffset - startOffset);
    }
  }
}

/**
 * List the text nodes a range covers, in document order. Whitespace that only
 * separates blocks (contains a line break and nothing else) is skipped.
 *
 * @param {Range} range - The selection range
 * @returns {Text[]} Text nodes to restyle
 */
function collectSelectedTextNodes(range) {
  const container = range.commonAncestorContainer;
  const root = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const isBlockSeparator = /^\s*$/.test(node.nodeValue) && /\n/.test(node.nodeValue);
    if (node.nodeValue !== "" && !isBlockSeparator && range.intersectsNode(node)) {
      nodes.push(node);
    }
  }
  return nodes;
}

/**
 * Give one text node the font size. If it already sits alone in a span that
 * carries a font size, that span is restyled instead of nesting another one.
 *
 * @param {Text} textNode - The text to size
 * @param {number} size - Size in pixels
 * @param {HTMLElement} editor - The editor root, which is never restyled
 * @returns {HTMLElement} The span that now holds the text
 */
function sizeTextNode(textNode, size, editor) {
  const parent = textNode.parentElement;
  const isSizeWrapper =
    parent &&
    parent !== editor &&
    parent.tagName === "SPAN" &&
    parent.childNodes.length === 1 &&
    parent.style.fontSize;
  if (isSizeWrapper) {
    parent.style.fontSize = `${size}px`;
    return parent;
  }

  const span = textNode.ownerDocument.createElement("span");
  span.style.fontSize = `${size}px`;
  textNode.parentNode.insertBefore(span, textNode);
  span.appendChild(textNode);
  return span;
}

/**
 * Apply a font size to exactly the text a range covers. Text outside the range,
 * in the same paragraph or elsewhere, keeps its current size.
 *
 * @param {Range} range - A non collapsed selection range inside the editor
 * @param {number} size - Size in pixels
 * @param {HTMLElement} editor - The editor root element
 * @returns {HTMLElement[]} The spans holding the resized text, in order
 */
export function applyFontSizeToRange(range, size, editor) {
  splitRangeBoundaries(range);
  return collectSelectedTextNodes(range).map((textNode) => sizeTextNode(textNode, size, editor));
}

/**
 * For a caret with nothing selected, insert an empty sized span at the caret and
 * return a caret inside it, so the next characters typed take the new size.
 *
 * @param {Range} range - A collapsed range inside the editor
 * @param {number} size - Size in pixels
 * @returns {Range} A collapsed range inside the new span, after its placeholder character
 */
export function createCaretSizeSpan(range, size) {
  const span = range.startContainer.ownerDocument.createElement("span");
  span.style.fontSize = `${size}px`;
  span.textContent = ZERO_WIDTH_SPACE;
  range.insertNode(span);

  const caret = range.startContainer.ownerDocument.createRange();
  caret.setStart(span.firstChild, 1);
  caret.collapse(true);
  return caret;
}

/**
 * Read the font size in effect at a node, so the size menu shows the size of the
 * text the caret is in.
 *
 * @param {Node|null} node - Usually the selection's anchor node
 * @param {HTMLElement} editor - The editor root element
 * @returns {number|null} Size in pixels, or null when the node is outside the editor
 */
export function getFontSizeAtNode(node, editor) {
  if (!node || !editor.contains(node)) return null;
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!element) return null;
  const pixels = parseFloat(window.getComputedStyle(element).fontSize);
  return Number.isFinite(pixels) ? clampFontSize(pixels) : null;
}
