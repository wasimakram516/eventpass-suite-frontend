"use client";

import React, { useState, useMemo } from "react";
import {
    Select,
    MenuItem,
    InputAdornment,
    Box,
    Typography,
    TextField,
    InputBase,
    ListSubheader,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, DEFAULT_ISO_CODE, getFlagImageUrl, getCountryCodeByIsoCode, getCountryCodeByCode, getLocalizedCountryName, normalizeForMatch } from "@/utils/countryCodes";

const CountryCodeSelector = ({
    value,
    onChange,
    disabled = false,
    dir = "ltr",
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const lang = dir === "rtl" ? "ar" : "en";

    let selectedIsoCode = null;
    if (value) {
        if (/^[a-z]{2,3}$/i.test(value)) {
            selectedIsoCode = value.toLowerCase();
        } else {
            const country = getCountryCodeByCode(value);
            selectedIsoCode = country?.isoCode || DEFAULT_ISO_CODE;
        }
    } else {
        selectedIsoCode = DEFAULT_ISO_CODE;
    }

    const selectedCountry = COUNTRY_CODES.find((cc) => cc.isoCode === selectedIsoCode) ||
        COUNTRY_CODES.find((cc) => cc.isoCode === DEFAULT_ISO_CODE);

    const localizedCountries = useMemo(() => {
        return COUNTRY_CODES.map((cc) => ({
            ...cc,
            displayName: getLocalizedCountryName(cc.isoCode, lang) || cc.country,
        }));
    }, [lang]);

    const filteredCountries = useMemo(() => {
        if (!searchQuery.trim()) {
            return localizedCountries;
        }
        const query = normalizeForMatch(searchQuery);
        return localizedCountries.filter(
            (country) =>
                normalizeForMatch(country.displayName).includes(query) ||
                normalizeForMatch(country.country).includes(query) ||
                country.code.includes(query) ||
                country.isoCode.toLowerCase().includes(query)
        );
    }, [localizedCountries, searchQuery]);

    return (
        <InputAdornment position="start" sx={{ m: 0 }}>
            <Select
                value={selectedIsoCode}
                onChange={(e) => {
                    const isoCode = e.target.value;
                    onChange(isoCode);
                }}
                disabled={disabled}
                dir={dir}
                renderValue={(selected) => {
                    const country = COUNTRY_CODES.find((cc) => cc.isoCode === selected);
                    return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 0.5 }}>
                            {country?.isoCode && (
                                <img
                                    src={getFlagImageUrl(country.isoCode)}
                                    alt={country.country}
                                    style={{
                                        width: "20px",
                                        height: "15px",
                                        objectFit: "cover",
                                        borderRadius: "2px",
                                    }}
                                />
                            )}
                            <span style={{ fontSize: "14px", marginRight: "2px" }}>{country?.code || selected}</span>
                        </Box>
                    );
                }}
                sx={{
                    "& .MuiSelect-select": {
                        py: 1,
                        pl: 1,
                        pr: "24px !important",
                        minWidth: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        border: "none",
                        "&:focus": {
                            backgroundColor: "transparent",
                        },
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                    },
                    "& .MuiSelect-icon": {
                        right: "4px !important",
                        width: "16px",
                    },
                }}
                MenuProps={{
                    slotProps: {
                        paper: {
                            sx: {
                                maxHeight: 400,
                            },
                        },
                    },
                    autoFocus: false,
                }}
                onClose={() => setSearchQuery("")}
            >
                <ListSubheader
                    sx={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "background.paper",
                        zIndex: 1,
                        p: 0,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box sx={{ p: 1.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            dir={dir}
                            placeholder={lang === "ar" ? "ابحث عن دولة…" : "Search country..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "background.default",
                                },
                            }}
                            slotProps={{
                                htmlInput: { dir },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Box>
                </ListSubheader>
                {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                        <MenuItem key={country.isoCode} value={country.isoCode} dir={dir}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {country.isoCode && (
                                    <img
                                        src={getFlagImageUrl(country.isoCode)}
                                        alt={country.displayName}
                                        style={{
                                            width: "24px",
                                            height: "18px",
                                            objectFit: "cover",
                                            borderRadius: "2px",
                                        }}
                                    />
                                )}
                                <Typography variant="body2">
                                    {country.displayName} ({country.code})
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>
                        <Typography variant="body2" sx={{
                            color: "text.secondary"
                        }}>
                            {lang === "ar" ? "لا توجد دول" : "No countries found"}
                        </Typography>
                    </MenuItem>
                )}
            </Select>
        </InputAdornment>
    );
};

export default CountryCodeSelector;

