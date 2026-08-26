const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ELCOT\\.gemini\\antigravity-ide\\brain\\415ca1ed-dde8-4a96-9a9c-dc2ea9070262';
const destDir = 'c:\\Users\\ELCOT\\Desktop\\Projects\\venue inventory\\apps\\web\\public\\images\\venues';

const files = fs.readdirSync(srcDir);

for (const file of files) {
  if (file.startsWith('venue_1_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'venue-1.jpg'));
  } else if (file.startsWith('venue_2_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'venue-2.jpg'));
  } else if (file.startsWith('venue_3_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'venue-3.jpg'));
  } else if (file.startsWith('venue_4_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'venue-4.jpg'));
  } else if (file.startsWith('venue_5_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'venue-5.jpg'));
  } else if (file.startsWith('fallback_') && file.endsWith('.jpg')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'fallback.jpg'));
  }
}
console.log('Done copying images.');
