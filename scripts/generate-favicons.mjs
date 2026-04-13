import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

async function main() {
  const root = process.cwd();
  const svgPath = path.join(root, 'favicon.svg');
  const svg = await fs.readFile(svgPath);

  const outputs = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  for (const o of outputs) {
    const buf = await sharp(svg)
      .resize(o.size, o.size, { fit: 'contain' })
      .png()
      .toBuffer();
    await fs.writeFile(path.join(root, o.name), buf);
    console.log('wrote', o.name);
  }


  // create a 256x256 PNG which png-to-ico expects as input
  const png256 = path.join(root, 'favicon-256x256.png');
  const buf256 = await sharp(svg).resize(256, 256, { fit: 'contain' }).png().toBuffer();
  await fs.writeFile(png256, buf256);
  try {
    const icoBuf = await pngToIco(png256);
    await fs.writeFile(path.join(root, 'favicon.ico'), icoBuf);
    console.log('wrote favicon.ico');
  } finally {
    // keep the 256 PNG (useful) — no cleanup
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
