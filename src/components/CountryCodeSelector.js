"use client";

import React from "react";
import {
    Select,
    MenuItem,
    InputAdornment,
    Box,
    Typography,
} from "@mui/material";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getFlagImageUrl } from "@/utils/countryCodes";

const CountryCodeSelector = ({
    value,
    onChange,
    disabled = false,
    dir = "ltr",
}) => {
    const selectedValue = value || DEFAULT_COUNTRY_CODE;
    const selectedCountry = COUNTRY_CODES.find((cc) => cc.code === selectedValue) ||
        COUNTRY_CODES.find((cc) => cc.code === DEFAULT_COUNTRY_CODE);

    return (
        <InputAdornment position="start" sx={{ m: 0 }}>
            <Select
                value={selectedValue}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                renderValue={(selected) => {
                    const country = COUNTRY_CODES.find((cc) => cc.code === selected);
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
                    PaperProps: {
                        sx: {
                            maxHeight: 300,
                        },
                    },
                }}
            >
                {COUNTRY_CODES.map((country) => (
                    <MenuItem key={country.isoCode || country.code} value={country.code}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {country.isoCode && (
                                <img
                                    src={getFlagImageUrl(country.isoCode)}
                                    alt={country.country}
                                    style={{
                                        width: "24px",
                                        height: "18px",
                                        objectFit: "cover",
                                        borderRadius: "2px",
                                    }}
                                />
                            )}
                            <Typography variant="body2">
                                {country.country} ({country.code})
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </InputAdornment>
    );
};

export default CountryCodeSelector;

