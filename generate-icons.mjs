import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, 'public');

// Icon sizes needed for PWA
const iconSizes = [
    { size: 48, name: 'icon-48x48.png' },
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 180, name: 'apple-touch-icon-180x180.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 256, name: 'icon-256x256.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
    { size: 512, name: 'maskable-icon-512x512.png', maskable: true }
];

// SVG source - using the 512x512 as base
const svgSource = join(publicDir, 'icon-512x512.svg');
const maskableSvgSource = join(publicDir, 'maskable-icon.svg');

async function generateIcons() {
    console.log('🎨 Generating PWA icons...\n');

    for (const icon of iconSizes) {
        try {
            const source = icon.maskable ? maskableSvgSource : svgSource;
            const outputPath = join(publicDir, icon.name);

            await sharp(source)
                .resize(icon.size, icon.size, {
                    fit: 'contain',
                    background: { r: 10, g: 15, b: 26, alpha: 1 } // #0A0F1A
                })
                .png({ quality: 100, compressionLevel: 9 })
                .toFile(outputPath);

            console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`);
        } catch (error) {
            console.error(`❌ Failed to generate ${icon.name}:`, error.message);
        }
    }

    console.log('\n✨ Icon generation complete!');
}

// Also generate a favicon.ico
async function generateFavicon() {
    try {
        const sizes = [16, 32, 48];
        const layers = [];

        for (const size of sizes) {
            const buffer = await sharp(svgSource)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 10, g: 15, b: 26, alpha: 1 }
                })
                .png()
                .toBuffer();
            layers.push(buffer);
        }

        // For simplicity, just use the 32x32 as favicon
        await sharp(svgSource)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 10, g: 15, b: 26, alpha: 1 }
            })
            .png()
            .toFile(join(publicDir, 'favicon.png'));

        console.log('✅ Generated: favicon.png');
    } catch (error) {
        console.error('❌ Failed to generate favicon:', error.message);
    }
}

generateIcons().then(generateFavicon);
