import { join } from './utils';
import { parse, stringify } from './frontmatter';
import { SRC_PAGES_DIR, DRAFTS_DIR, DELETED_PAGS_DIR } from './data';
import { isPost, isDraft, fileName } from './state';

const fs = Neutralino.filesystem;

const fullFileName = (draft) => {
  if (draft ?? isDraft) {
    return join(DRAFTS_DIR, isPost ? 'posts' : 'pages', fileName);
  } else {
    return join(SRC_PAGES_DIR, isPost ? '_posts' : '', fileName);
  }
};
export const readMd = async () => parse(await fs.readFile(fullFileName()));

export const removeMd = async (both = false) => {
  if (isDraft) await fs.removeFile(fullFileName(true));
  if (both) {
    await fs.moveFile(fullFileName(false), join(DELETED_PAGS_DIR, fileName));
  }
};

export const saveMD = async (matter, content) =>
  await fs.writeFile(fullFileName(), stringify(matter, content));
