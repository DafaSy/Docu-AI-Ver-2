const fs = require('fs');
const path = require('path');

const directoryPath = 'c:\\Users\\dafad\\Downloads\\DocuAI\\project\\src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(directoryPath);

let filesModified = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Fix double dark:
    content = content.replace(/dark:dark:/g, 'dark:');

    // Find any className="..." that contains a hardcoded hex background bg-[#...]
    // BUT NOT if it is prefixed with dark:bg-[#...]
    // If it is a hardcoded dark background and doesn't have the 'dark' class, add it!
    content = content.replace(/className=(["`])(.*?)\1/g, (match, quote, classes) => {
        // If it already has 'dark' as a standalone class, skip
        if (/(^|\s)dark(\s|$)/.test(classes)) return match;

        // If it has bg-[#... that is NOT preceded by dark:
        // Let's use a regex to check for bg-\[#
        // We split by space to examine each class
        const classList = classes.split(/\s+/);
        let hasForcedDarkBg = false;
        let hasDualThemeBg = false;

        for (const cls of classList) {
            if (cls.startsWith('bg-[#')) {
                hasForcedDarkBg = true;
            }
            if (cls.startsWith('dark:bg-[')) {
                hasDualThemeBg = true;
            }
        }

        // If it has a forced dark bg, and NO dual theme bg, it is a forced dark section!
        if (hasForcedDarkBg && !hasDualThemeBg) {
            return `className=${quote}${classes} dark${quote}`;
        }

        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        filesModified++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Complete. Modified ${filesModified} files.`);
