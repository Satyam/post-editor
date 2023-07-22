import { join } from './utils';

const fs = Neutralino.filesystem;

export const imagesToEditor = async () => {
  const files = await fs.readDirectory(NL_HEXO_IMG_DIR);
  return Promise.all(
    files.map(async (f) => {
      if (f.type === 'DIRECTORY') return;
      const srcImg = join(NL_HEXO_IMG_DIR, f.entry);
      const srcInfo = await fs.getStats(srcImg);
      const edImg = join(NL_EDITOR_IMG_DIR, f.entry);
      const edInfo = await fs.getStats(edImg).catch(() => ({}));
      if (!edInfo.size || edInfo.modifiedAt < srcInfo.modifiedAt) {
        await fs.copyFile(srcImg, edImg);
      }
    })
  );
};
