import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const srcImg = './src/assets/images/app_icon_8ball_1789633273642.jpg';
const publicIconsDir = './public/icons';

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

async function run() {
  console.log('Generating PWA icons from', srcImg);
  
  // 192x192
  await sharp(srcImg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicIconsDir, 'pwa-192x192.png'));

  // 512x512
  await sharp(srcImg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicIconsDir, 'pwa-512x512.png'));

  // 144x144
  await sharp(srcImg)
    .resize(144, 144)
    .png()
    .toFile(path.join(publicIconsDir, 'pwa-144x144.png'));

  // Apple touch icon 180x180
  await sharp(srcImg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicIconsDir, 'apple-touch-icon.png'));

  // Also root copies for standard web crawlers and shortcuts
  await sharp(srcImg)
    .resize(192, 192)
    .png()
    .toFile('./public/pwa-192x192.png');

  await sharp(srcImg)
    .resize(512, 512)
    .png()
    .toFile('./public/pwa-512x512.png');

  await sharp(srcImg)
    .resize(64, 64)
    .png()
    .toFile('./public/favicon.png');

  // Maskable 512x512 (with 10% safe padding)
  await sharp(srcImg)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#030712'
    })
    .png()
    .toFile(path.join(publicIconsDir, 'maskable-icon-512x512.png'));

  await sharp(srcImg)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#030712'
    })
    .png()
    .toFile('./public/maskable-icon-512x512.png');

  console.log('PWA icons successfully generated!');
}

run().catch(console.error);
