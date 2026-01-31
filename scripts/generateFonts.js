const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../src/fonts');
const fontScannerOutput = path.join(__dirname, '../src/utils/fontScanner.js');
const badgePDFOutput = path.join(__dirname, '../src/components/badges/BadgePDF.js');

function parseFontFileName(fileName) {
    const name = fileName.replace(/\.(ttf|otf)$/i, '');
    const lower = name.toLowerCase();

    let weight = 400;
    if (lower.includes('light')) weight = 300;
    else if (lower.includes('medium')) weight = 500;
    else if (lower.includes('bold')) weight = 700;
    else if (lower.includes('heavy')) weight = 800;
    else if (lower.includes('extrabold') || lower.includes('extra-bold') || lower.includes('extrabd')) weight = 900;
    else if (lower.includes('regular') || lower.includes('book') || lower.includes('normal')) weight = 400;

    let style = 'normal';
    if (lower.includes('italic') || lower.includes('oblique') || lower.includes('obl')) style = 'italic';

    return { weight, style, name };
}

function scanFonts() {
    if (!fs.existsSync(fontsDir)) {
        console.warn('Fonts directory does not exist:', fontsDir);
        return {};
    }

    const fontFamilies = {};
    const fontDirs = fs.readdirSync(fontsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    fontDirs.forEach(fontDir => {
        const fontPath = path.join(fontsDir, fontDir);
        const files = fs.readdirSync(fontPath).filter(f => /\.(ttf|otf)$/i.test(f));

        if (files.length === 0) return;

        let familyName = fontDir
            .split(/[-_\s]+/)
            .map(word => {
                if (word.toUpperCase() === word && word.length > 1) {
                    return word;
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');

        const specialCases = {
            'Ibmplexsansarabic': 'IBM Plex Sans Arabic',
            'Ibm Plex Sans Arabic': 'IBM Plex Sans Arabic'
        };

        if (specialCases[familyName]) {
            familyName = specialCases[familyName];
        }

        const fontKey = fontDir.replace(/[-_\s]/g, '');

        const fontFiles = files.map(file => {
            const { weight, style } = parseFontFileName(file);
            return {
                path: `/fonts/${fontDir}/${file}`,
                weight,
                style
            };
        });

        fontFamilies[fontKey] = {
            name: familyName,
            family: familyName,
            files: fontFiles
        };
    });

    return fontFamilies;
}

function generateFontScanner(fontFamilies) {
    const fontEntries = Object.entries(fontFamilies).map(([key, font]) => {
        const filesStr = font.files.map(f =>
            `      { path: "${f.path}", weight: ${f.weight}, style: "${f.style}" }`
        ).join(',\n');

        return `  ${key}: {
    name: "${font.name}",
    family: "${font.family}",
    files: [
${filesStr}
    ]
  }`;
    }).join(',\n\n');

    return `const fontFamilies = {
${fontEntries}
};

export function scanFonts() {
  return Object.values(fontFamilies);
}

export function getFontFamily(fontName) {
  const font = Object.values(fontFamilies).find(f => f.name === fontName || f.family === fontName);
  return font ? font.family : "Arial";
}
`;
}

function generateBadgePDFImports(fontFamilies) {
    const imports = [];
    const registrations = [];

    Object.entries(fontFamilies).forEach(([key, font]) => {
        const fontVars = [];
        font.files.forEach((file, index) => {
            const varName = `${key}_${index}`.replace(/[^a-zA-Z0-9_]/g, '_');
            const importPath = file.path.replace(/^\//, '../../');
            imports.push(`import ${varName} from "${importPath}";`);
            fontVars.push({ varName, ...file });
        });

        const fontEntries = fontVars.map(({ varName, weight, style }) =>
            `    { src: ${varName}, fontWeight: ${weight}, fontStyle: '${style}' }`
        ).join(',\n');

        registrations.push(`Font.register({
  family: "${font.family}",
  fonts: [
${fontEntries}
  ],
});`);
    });

    return { imports, registrations };
}

function copyFontsToPublic(fontFamilies) {
    const publicFontsDir = path.join(__dirname, '../public/fonts');

    // Ensure public/fonts directory exists
    if (!fs.existsSync(publicFontsDir)) {
        fs.mkdirSync(publicFontsDir, { recursive: true });
    }

    const fontDirs = fs.readdirSync(fontsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    fontDirs.forEach(fontDirName => {
        const srcFontDir = path.join(fontsDir, fontDirName);
        const destFontDir = path.join(publicFontsDir, fontDirName);

        if (!fs.existsSync(destFontDir)) {
            fs.mkdirSync(destFontDir, { recursive: true });
        }

        const fontFiles = fs.readdirSync(srcFontDir).filter(f => /\.(ttf|otf)$/i.test(f));
        fontFiles.forEach(fileName => {
            const srcPath = path.join(srcFontDir, fileName);
            const destPath = path.join(destFontDir, fileName);

            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    });
}

try {
    const fontFamilies = scanFonts();

    if (Object.keys(fontFamilies).length === 0) {
        console.warn('No fonts found in', fontsDir);
        return;
    }

    copyFontsToPublic(fontFamilies);
    console.log('✓ Copied fonts to public/fonts');

    const { imports, registrations } = generateBadgePDFImports(fontFamilies);

    const fontScannerContent = generateFontScanner(fontFamilies);
    fs.writeFileSync(fontScannerOutput, fontScannerContent, 'utf8');
    console.log('✓ Generated fontScanner.js');

    const badgePDFContent = fs.readFileSync(badgePDFOutput, 'utf8');

    const importSection = imports.join('\n');
    const registrationSection = registrations.join('\n\n');

    const newImportSection = `// Auto-generated font imports\n${importSection}\n\n// --------------------------------------------------------------`;
    const newRegistrationSection = `// --------------------------------------------------------------\n// STATIC FONT REGISTRATION (AUTO-GENERATED)\n// --------------------------------------------------------------\n${registrationSection}\n\nconst A6_WIDTH`;

    let updatedContent = badgePDFContent;

    const reactPdfImportEnd = updatedContent.indexOf('} from "@react-pdf/renderer";');
    if (reactPdfImportEnd !== -1) {
        const afterReactPdfImport = updatedContent.indexOf('\n', reactPdfImportEnd) + 1;
        const nextCommentIndex = updatedContent.indexOf('// --------------------------------------------------------------', afterReactPdfImport);

        if (nextCommentIndex !== -1) {
            updatedContent = updatedContent.slice(0, afterReactPdfImport) + '\n' + newImportSection + '\n' + updatedContent.slice(nextCommentIndex);
        } else {
            updatedContent = updatedContent.slice(0, afterReactPdfImport) + '\n' + newImportSection + '\n' + updatedContent.slice(afterReactPdfImport);
        }
    }

    const registrationStartMarker = '// --------------------------------------------------------------\n// STATIC FONT REGISTRATION';
    const registrationEndMarker = '\nconst A6_WIDTH';

    const regStartIndex = updatedContent.indexOf(registrationStartMarker);
    const regEndIndex = updatedContent.indexOf(registrationEndMarker);

    if (regStartIndex !== -1 && regEndIndex !== -1 && regEndIndex > regStartIndex) {
        updatedContent = updatedContent.slice(0, regStartIndex) + newRegistrationSection + updatedContent.slice(regEndIndex + 1);
    } else {
        const a6Index = updatedContent.indexOf('const A6_WIDTH');
        if (a6Index !== -1) {
            const beforeA6 = updatedContent.lastIndexOf('\n', a6Index);
            updatedContent = updatedContent.slice(0, beforeA6 + 1) + newRegistrationSection + updatedContent.slice(a6Index);
        }
    }

    updatedContent = updatedContent.replace(/\/\/ --------------------------------------------------------------\/\/ --------------------------------------------------------------/g, '// --------------------------------------------------------------');
    updatedContent = updatedContent.replace(/const A6_WIDTH\s*\n\s*const A6_WIDTH/g, 'const A6_WIDTH');
    updatedContent = updatedContent.replace(/const A6_WIDTHconst A6_WIDTH/g, 'const A6_WIDTH');

    fs.writeFileSync(badgePDFOutput, updatedContent, 'utf8');
    console.log('✓ Updated BadgePDF.js with font imports and registrations');
    console.log(`✓ Found ${Object.keys(fontFamilies).length} font families: ${Object.keys(fontFamilies).join(', ')}`);
} catch (error) {
    console.error('Error generating fonts:', error);
    process.exit(1);
}

