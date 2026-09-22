const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const imageRoots = [
  { path: path.join(__dirname, 'img', 'imgposlugi'), extensions: ['.png'] },
  { path: path.join(__dirname, 'img', 'firstbanner.png'), extensions: ['.png'] },
  { path: path.join(__dirname, 'img', 'firstbanner-hero.jpg'), extensions: ['.jpg'] },
];

async function collectSourceFiles(entry, extensions) {
  const metadata = await fs.stat(entry);
  if (metadata.isFile()) {
    return extensions.includes(path.extname(entry).toLowerCase()) ? [entry] : [];
  }

  const files = await fs.readdir(entry, { withFileTypes: true });
  const nested = await Promise.all(files.map((file) => collectSourceFiles(path.join(entry, file.name), extensions)));
  return nested.flat();
}

async function optimize(source) {
  const destination = source.replace(/\.(?:png|jpe?g)$/i, '.webp');
  const sourceSize = (await fs.stat(source)).size;

  await sharp(source)
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(destination);

  const destinationSize = (await fs.stat(destination)).size;
  const relativePath = path.relative(__dirname, source).replaceAll('\\', '/');
  const reduction = Math.round((1 - destinationSize / sourceSize) * 100);
  console.log(`${relativePath}: ${reduction}% smaller`);
}

async function main() {
  const files = (await Promise.all(imageRoots.map(({ path: entry, extensions }) => collectSourceFiles(entry, extensions)))).flat();
  await Promise.all(files.map(optimize));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});