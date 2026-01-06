const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\tenjung\\.gemini\\antigravity\\brain\\e5f5489e-276d-41d3-b035-d03dade5ec12\\og_image_daonview_1767665641900.png';
const dest = 'c:\\Users\\tenjung\\daonview\\public\\og-image.png';

try {
    fs.copyFileSync(src, dest);
    console.log('Successfully copied to ' + dest);
} catch (err) {
    console.error('Error copying file:', err);
}
