const fs = require('fs');
const path = require('path');

const urls = {
  'q64.jpg': 'https://drive.google.com/uc?export=download&id=1RUtWluACAV5GSLMM6NAZPF_2S1z1iiMv',
  'q85.jpg': 'https://drive.google.com/uc?export=download&id=1hiM-GaL0tZ9O0q33IAl_oIDePw1WBPgr',
  'q91.jpg': 'https://drive.google.com/uc?export=download&id=11fHirvLQQmxUw7aWQ-hDdsK0IhpQ_OwF'
};

const imgDir = path.join(__dirname, 'images');

async function downloadAll() {
  for (const [filename, url] of Object.entries(urls)) {
    console.log(`Downloading ${filename}...`);
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(`Failed to download ${filename}: ${resp.statusText}`);
        continue;
      }
      const buffer = await resp.arrayBuffer();
      fs.writeFileSync(path.join(imgDir, filename), Buffer.from(buffer));
      console.log(`Successfully downloaded ${filename}`);
    } catch (e) {
      console.error(`Error with ${filename}:`, e);
    }
  }
}

downloadAll();
