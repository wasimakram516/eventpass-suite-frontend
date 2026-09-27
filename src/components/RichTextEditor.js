"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    Toolbar,
    IconButton,
    Popover,
    Select,
    MenuItem,
    FormControl,
    Tooltip,
} from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import {
    FONT_SIZE_LIMITS,
    applyFontSizeToRange,
    clampFontSize,
    createCaretSizeSpan,
    getFontSizeAtNode,
} from "@/utils/richTextDom";

const ALIGN_COMMANDS = {
    left: "justifyLeft",
    center: "justifyCenter",
    right: "justifyRight",
    justify: "justifyFull",
};

const FONT_SIZE_OPTIONS = Array.from(
    { length: FONT_SIZE_LIMITS.MAX - FONT_SIZE_LIMITS.MIN + 1 },
    (_, index) => FONT_SIZE_LIMITS.MIN + index,
);

/**
 * Read the first text-align in saved HTML so the toolbar can start highlighted.
 *
 * @param {string|undefined|null} html - Saved editor HTML
 * @returns {"left"|"center"|"right"|"justify"|null}
 */
const detectAlignment = (html) => {
    const match = String(html || "").match(/text-align:\s*(center|left|right|justify)/i);
    return match ? match[1].toLowerCase() : null;
};

const RichTextEditor = ({ value, onChange, placeholder, dir, minHeight, maxHeight }) => {
    const editorRef = useRef(null);
    const colorPickerAnchorRef = useRef(null);
    const savedRangeRef = useRef(null);
    const [activeCommands, setActiveCommands] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
    });
    const [alignment, setAlignment] = useState(null);
    const [fontSize, setFontSize] = useState(FONT_SIZE_LIMITS.DEFAULT);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    // Remember the last selection made inside the editor. Toolbar controls (the
    // size menu, the color popover) take focus away, so the selection is restored
    // from here before a command runs.
    useEffect(() => {
        const rememberSelection = () => {
            const editor = editorRef.current;
            const selection = window.getSelection();
            if (!editor || selection.rangeCount === 0) return;
            if (editor.contains(selection.anchorNode)) {
                savedRangeRef.current = selection.getRangeAt(0).cloneRange();
            }
        };
        document.addEventListener("selectionchange", rememberSelection);
        return () => document.removeEventListener("selectionchange", rememberSelection);
    }, []);

    useEffect(() => {
        if (!editorRef.current) return;
        const el = editorRef.current;
        if (document.activeElement === el || el.contains(document.activeElement)) return;
        if (value === el.innerHTML) return;
        el.innerHTML = value || "";
        savedRangeRef.current = null;

        // Only seed the toolbar. Never re-apply alignment to the content (that would
        // change a saved block) and never style the whole editor box.
        const savedAlignment = detectAlignment(value);
        if (savedAlignment) setAlignment(savedAlignment);
    }, [value]);

    const updateActiveCommands = () => {
        const editor = editorRef.current;
        const selection = window.getSelection();
        if (!editor || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) return;

        setActiveCommands({
            bold: document.queryCommandState("bold"),
            italic: document.queryCommandState("italic"),
            underline: document.queryCommandState("underline"),
            strikethrough: document.queryCommandState("strikethrough"),
        });

        const isLeft = document.queryCommandState("justifyLeft");
        const isCenter = document.queryCommandState("justifyCenter");
        const isRight = document.queryCommandState("justifyRight");
        const isFull = document.queryCommandState("justifyFull");

        if (isFull) setAlignment("justify");
        else if (isCenter && !isLeft && !isRight) setAlignment("center");
        else if (isRight && !isLeft && !isCenter) setAlignment("right");
        else if (isLeft && !isCenter && !isRight) setAlignment("left");
        else setAlignment(null);

        // The size menu shows the size of the text the caret is in.
        const sizeAtCaret = getFontSizeAtNode(selection.anchorNode, editor);
        if (sizeAtCaret) setFontSize(sizeAtCaret);
    };

    const handleInput = () => {
        if (editorRef.current && onChange) {
            onChange(editorRef.current.innerHTML);
        }

        updateActiveCommands();
    };

    const handleFocus = () => {
        updateActiveCommands();
    };

    // Refresh the toolbar and report the change once the browser has applied an edit.
    const finishEdit = () => {
        setTimeout(() => {
            if (!editorRef.current) return;
            updateActiveCommands();
            handleInput();
        }, 0);
    };

    // Bring back the selection made in the editor before focus moved to a toolbar
    // control, then focus the editor so a command acts on it.
    const restoreSelection = () => {
        const editor = editorRef.current;
        if (!editor) return null;
        const selection = window.getSelection();
        const insideEditor = selection.rangeCount > 0 && editor.contains(selection.anchorNode);
        if (!insideEditor && savedRangeRef.current) {
            selection.removeAllRanges();
            selection.addRange(savedRangeRef.current);
        }
        editor.focus();
        return selection;
    };

    const executeCommand = (command, commandValue = null) => {
        if (!restoreSelection()) return;
        document.execCommand(command, false, commandValue);
        finishEdit();
    };

    // Clears an explicit text-align only on the blocks the selection touches, so
    // aligning one line never changes the others.
    const clearAlignmentInSelection = (range) => {
        const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_ELEMENT, null);
        const touched = [];
        let node;
        while ((node = walker.nextNode())) {
            const inSelection = range.intersectsNode(node) || node.contains(range.commonAncestorContainer);
            if (node.style && node.style.textAlign && inSelection) touched.push(node);
        }
        touched.forEach((element) => {
            element.style.textAlign = "";
        });
    };

    const handleAlignment = (align) => {
        const selection = restoreSelection();
        if (!selection) return;
        if (selection.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            selection.addRange(range);
        }
        clearAlignmentInSelection(selection.getRangeAt(0));

        // Choosing the active alignment again toggles it off, back to left.
        const target = alignment === align ? "left" : align;
        try {
            // Make the browser write text-align as CSS, never as an align attribute.
            document.execCommand("styleWithCSS", false, true);
            document.execCommand(ALIGN_COMMANDS[target], false, null);
        } finally {
            try {
                document.execCommand("styleWithCSS", false, false);
            } catch (e) {
                // Browser doesn't support styleWithCSS
            }
        }

        setAlignment(target);
        finishEdit();
    };

    const handleFontColor = (color) => {
        executeCommand("foreColor", color);
        setColorPickerOpen(false);
    };

    // Applies the size to exactly the selected text, or to what is typed next when
    // nothing is selected. Text outside the selection is never touched.
    const handleFontSize = (event) => {
        const size = clampFontSize(event.target.value);
        setFontSize(size);

        const selection = restoreSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);

        if (range.collapsed) {
            const caret = createCaretSizeSpan(range, size);
            selection.removeAllRanges();
            selection.addRange(caret);
        } else {
            const spans = applyFontSizeToRange(range, size, editorRef.current);
            if (spans.length > 0) {
                const resized = document.createRange();
                resized.setStartBefore(spans[0]);
                resized.setEndAfter(spans[spans.length - 1]);
                selection.removeAllRanges();
                selection.addRange(resized);
            }
        }
        finishEdit();
    };

    return (
        <Box
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                "&:focus-within": {
                    borderColor: "primary.main",
                },
            }}
        >
            <Toolbar
                variant="dense"
                sx={{
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    minHeight: "40px !important",
                    bgcolor: "action.hover",
                    gap: 0.5,
                    flexWrap: "wrap",
                    "& .MuiIconButton-root": {
                        padding: "4px",
                    },
                }}
            >
                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", pr: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("bold")}
                        sx={{
                            bgcolor: activeCommands.bold ? "action.selected" : "transparent",
                        }}
                        title="Bold (Ctrl+B)"
                    >
                        <FormatBoldIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("italic")}
                        sx={{
                            bgcolor: activeCommands.italic ? "action.selected" : "transparent",
                        }}
                        title="Italic (Ctrl+I)"
                    >
                        <FormatItalicIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("underline")}
                        sx={{
                            bgcolor: activeCommands.underline ? "action.selected" : "transparent",
                        }}
                        title="Underline (Ctrl+U)"
                    >
                        <FormatUnderlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("strikethrough")}
                        sx={{
                            bgcolor: activeCommands.strikethrough ? "action.selected" : "transparent",
                        }}
                        title="Strikethrough"
                    >
                        <StrikethroughSIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        ref={colorPickerAnchorRef}
                        onClick={() => setColorPickerOpen(true)}
                        title="Text Color"
                    >
                        <FormatColorTextIcon fontSize="small" />
                    </IconButton>
                    <Popover
                        open={colorPickerOpen}
                        anchorEl={colorPickerAnchorRef.current}
                        onClose={() => setColorPickerOpen(false)}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                    >
                        <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1 }}>
                            {[
                                "#000000", "#333333", "#666666", "#999999",
                                "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                                "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                                "#FFC0CB", "#A52A2A", "#000080", "#008000",
                                "#FFFFFF",
                            ].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => handleFontColor(color)}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        bgcolor: color,
                                        border: (theme) =>
                                            color === "#FFFFFF"
                                                ? `1px solid ${theme.palette.mode === "dark" ? "#666" : "#999"}`
                                                : `1px solid ${theme.palette.divider}`,
                                        cursor: "pointer",
                                        "&:hover": { border: "2px solid #000" },
                                    }}
                                />
                            ))}
                        </Box>
                    </Popover>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("insertUnorderedList")}
                        title="Bullet List"
                    >
                        <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("insertOrderedList")}
                        title="Numbered List"
                    >
                        <FormatListNumberedIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => handleAlignment("left")}
                        sx={{
                            bgcolor: alignment === "left" ? "action.selected" : "transparent",
                        }}
                        title="Align Left"
                    >
                        <FormatAlignLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleAlignment("center")}
                        sx={{
                            bgcolor: alignment === "center" ? "action.selected" : "transparent",
                        }}
                        title="Align Center"
                    >
                        <FormatAlignCenterIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleAlignment("right")}
                        sx={{
                            bgcolor: alignment === "right" ? "action.selected" : "transparent",
                        }}
                        title="Align Right"
                    >
                        <FormatAlignRightIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleAlignment("justify")}
                        sx={{ bgcolor: alignment === "justify" ? "action.selected" : "transparent" }}
                        title="Justify"
                    >
                        <FormatAlignJustifyIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, borderRight: "1px solid", borderColor: "divider", px: 0.5, alignItems: "center" }}>
                    <Tooltip title="Font Size">
                        <FormControl size="small" variant="outlined" sx={{ minWidth: 80 }}>
                            <Select
                                value={fontSize}
                                onChange={handleFontSize}
                                displayEmpty
                                MenuProps={{
                                    slotProps: {
                                        paper: {
                                            style: {
                                                maxHeight: 240,
                                            },
                                        },
                                    },
                                }}
                                sx={{
                                    height: "32px",
                                    fontSize: "0.875rem",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderWidth: "1px",
                                    },
                                }}
                            >
                                {FONT_SIZE_OPTIONS.map((size) => (
                                    <MenuItem key={size} value={size}>
                                        {size}px
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Tooltip>
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, px: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => executeCommand("removeFormat")}
                        title="Clear Formatting"
                    >
                        <FormatClearIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Toolbar>
            <Box
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-multiline="true"
                aria-label={placeholder || undefined}
                data-placeholder={placeholder || ""}
                onInput={handleInput}
                onFocus={handleFocus}
                onMouseUp={updateActiveCommands}
                onKeyUp={updateActiveCommands}
                dir={dir}
                sx={{
                    minHeight: minHeight || "96px",
                    maxHeight: maxHeight || "256px",
                    overflowY: "auto",
                    p: 2,
                    outline: "none",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "text.primary",
                    "&:empty:before": {
                        content: "attr(data-placeholder)",
                        color: "text.disabled",
                    },
                    "& h1": { fontSize: "2em", fontWeight: "bold", margin: "0.67em 0" },
                    "& h2": { fontSize: "1.5em", fontWeight: "bold", margin: "0.75em 0" },
                    "& h3": { fontSize: "1.17em", fontWeight: "bold", margin: "0.83em 0" },
                    "& ul, & ol": { margin: "1em 0", paddingLeft: "2.5em" },
                    "& ul": { listStyleType: "disc" },
                    "& ol": { listStyleType: "decimal" },
                    "& li": { margin: "0.5em 0" },
                    "& p": { margin: "1em 0" },
                    "& strong, & b": { fontWeight: "bold" },
                    "& em, & i": { fontStyle: "italic" },
                    "& u": { textDecoration: "underline" },
                    "& s, & strike": { textDecoration: "line-through" },
                }}
            />
        </Box>
    );
};

export default RichTextEditor;
