/**
 * Converts Western digits (0-9) to Arabic-Indic numerals (٠-٩)
 */
export const toArabicDigits = (text, language) => {
    if (language !== "ar") return text;
    if (typeof text !== "string") text = String(text);
    return text.replace(/\d/g, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) + 0x0630)
    );
};

/**
 * Converts Arabic-Indic numerals (٠-٩) back to Western digits (0-9)
 */
export const fromArabicDigits = (text) => {
    if (typeof text !== "string") text = String(text);
    return text.replace(/[٠-٩]/g, (digit) =>
        String.fromCharCode(digit.charCodeAt(0) - 0x0630)
    );
};

