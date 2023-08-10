import { join } from './utils';
import { parse, stringify } from './frontmatter';
import { SRC_PAGES_DIR, DRAFTS_DIR, DELETED_PAGS_DIR } from './data';
import { isPost, isDraft, fileName, setMdType } from './state';

const fs = Neutralino.filesystem;

const fullFileName = (fName) => {
  if (isDraft) {
    return join(DRAFTS_DIR, isPost ? 'posts' : 'pages', fName ?? fileName);
  } else {
    return join(SRC_PAGES_DIR, isPost ? '_posts' : '', fName ?? fileName);
  }
};
export const readMd = async () => parse(await fs.readFile(fullFileName()));

export const removeMd = async (both = false) => {
  // I am being careless about the `isDraft` status because it won't matter
  // after the file is removed anyway.
  setMdType(isPost, true);
  await fs.removeFile(fullFileName());
  if (both) {
    setMdType(isPost, false);
    await fs.moveFile(fullFileName(), join(DELETED_PAGS_DIR, fileName));
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
