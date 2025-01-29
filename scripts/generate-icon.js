const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../public/icon.svg');
const outputPath = path.join(__dirname, '../public/icon128.png');

sharp(inputPath)
  .resize(128, 128)
  .png()
  .toFile(outputPath)
  .then(() => console.log('Icon generated successfully!'))
  .catch(err => console.error('Error generating icon:', err)); 