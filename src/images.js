import { join } from './utils';
import { HEXO_IMG_DIR, EDITOR_IMG_DIR } from './data';
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
