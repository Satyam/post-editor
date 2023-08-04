import { join } from './utils';
import { HEXO_IMG_DIR, EDITOR_IMG_DIR, DOCUMENT_ROOT } from './data';
import editor from './editor';
import { canvas } from './elements';
const fs = Neutralino.filesystem;

export const imagesToEditor = async () => {
  const files = await fs.readDirectory(HEXO_IMG_DIR);
  return Promise.all(
    files.map(async (f) => {
      if (f.type === 'DIRECTORY') return;
      const srcImg = join(HEXO_IMG_DIR, f.entry);
      const srcInfo = await fs.getStats(srcImg);
      const edImg = join(EDITOR_IMG_DIR, f.entry);
      const edInfo = await fs.getStats(edImg).catch(() => ({}));
      if (!edInfo.size || edInfo.modifiedAt < srcInfo.modifiedAt) {
        await fs.copyFile(srcImg, edImg);
      }
    })
  );
};

const getBlob = (canvas) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob));
  });

export const replaceImages = async () => {
  const ctx = canvas.getContext('2d');
  const images = editor.getImagesInfo();

  for (const img of images) {
    const imgEl = img.element;
    if (!img.src.startsWith('data:')) continue;
    const w = 800;
    const h = Math.ceil(800 * (imgEl.naturalHeight / imgEl.naturalWidth));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(imgEl, 0, 0, w, h);
    const imgFileName = join(EDITOR_IMG_DIR, img.name);
    const blob = await getBlob(canvas);
    const buffer = await blob.arrayBuffer();
    await fs.writeBinaryFile(imgFileName, buffer);
    imgEl.src = imgFileName.replace(DOCUMENT_ROOT, '');
    imgEl.setAttribute('origin-size', `${w},${h}`);
  }
};
