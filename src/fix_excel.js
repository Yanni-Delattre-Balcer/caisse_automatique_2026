const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to find the formatPrice body
// Match precisely the block with any indentation
const findRegex = /const\s+detailStr\s+=\s+detailParts\.join\("\s\+\s"\);\s+if\s+\(detailStr\)\s+\{\s+return\s+\{\s+v:\s+sum,\s+t:\s+'n',\s+z:\s+`#\s##0"\s€\s\(\${detailStr}\)"`\s+};\s+}/g;

content = content.replace(findRegex, (match) => {
    // Determine indentation from the match if possible, or use a default
    const indent = match.match(/^\s*/)[0];
    return `let detailStr = detailParts.join(" + ").replace(/"/g, "'");
        if (detailStr.length > 180) detailStr = detailStr.substring(0, 177) + "...";
        if (detailStr) {
          return { v: sum, t: 'n', z: \`# ##0" € (\${detailStr})"\` };
        }`;
});

fs.writeFileSync(filePath, content);
console.log('App.jsx has been updated with sanitized formatPrice bodies.');
