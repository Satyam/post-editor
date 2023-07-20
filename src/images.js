import { config, neutralinoConfig } from './init';
import { join } from './utils';

const fs = Neutralino.filesystem;

export const imagesToEditor = async () => {
  const files = await fs.readDirectory(config.srcImagesDir);
  return Promise.all(
    files.map(async (f) => {
      if (f.type === 'DIRECTORY') return;
      const srcImg = join(config.srcImagesDir, f.entry);
      const srcInfo = await fs.getStats(srcImg);
      const edImg = join(
        NL_CWD,
        neutralinoConfig.documentRoot,
        config.editorImagesDir,
        f.entry
      );
      const edInfo = await fs.getStats(edImg).catch(() => ({}));

      if (!edInfo.size || edInfo.modifiedAt < srcInfo.modifiedAt) {
        await fs.copyFile(srcImg, edImg);
      }
    })
  );
};
