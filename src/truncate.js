const fs = require('fs');
const path = 'c:/Users/yanni/Desktop/caisse_mam/frontend/src/App.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const truncated = lines.slice(0, 2620).join('\n');
fs.writeFileSync(path, truncated);
console.log('Truncated to 2620 lines');
