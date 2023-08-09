import { join } from './utils';
import { parse, stringify } from './frontmatter';
import { SRC_PAGES_DIR, DRAFTS_DIR } from './data';
import { isPost, isDraft, fileName } from './state';

const fs = Neutralino.filesystem;

const fullFileName = (fName) => {
  if (isDraft) {
    return join(DRAFTS_DIR, isPost ? 'posts' : 'pages', fName ?? fileName);
  } else {
    return join(SRC_PAGES_DIR, isPost ? '_posts' : '', fName ?? fileName);
  }
};
export const readMd = async () => parse(await fs.readFile(fullFileName()));

export const removeMd = async () => {
  if (isDraft) {
    await fs.removeFile(fullFileName());
  } else {
    // let which = isPost ? posts : pages;
    // const fn = fileName.replace(srcDirRx, '');
    // which = which.filter((data) => data.file !== fn);
    /// TODO
    console.log('remove', fileName, fullFileName());
    debugger;

    return;
  }
};

export const saveMD = async (matter, content) =>
  await fs.writeFile(fullFileName(), stringify(matter, content));

export const fileExists = async (fName) => {
  try {
    await fs.getStats(fullFileName(fName));
    return true;
  } catch (err) {
    if (err === NE_FS_NOPATHE) return false;
    throw err;
  }
};
