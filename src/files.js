import { readJson, writeJson } from './utils';
import { parse, stringify } from './frontmatter';
import {
  isPost,
  isDraft,
  fileName,
  removeDraftInfo,
  SRC_PAGES_DIR,
  DRAFTS_DIR,
} from './data';

const fs = Neutralino.filesystem;

export const readMd = async () => parse(await fs.readFile(fileName));

const draftsDirRx = new RegExp(`^${DRAFTS_DIR}/`);
const srcDirRx = new RegExp(`^${SRC_PAGES_DIR}/`);

export const removeMd = async () => {
  if (isDraft) {
    await fs.removeFile(fileName);
    await removeDraftInfo(fileName.replace(draftsDirRx, ''));
  } else {
    let which = isPost ? posts : pages;
    const fn = fileName.replace(srcDirRx, '');
    which = which.filter((data) => data.file !== fn);
    /// TODO
    console.log('remove', fileName);
    debugger;

    return;
  }
};

export const saveMD = async (path, matter, content) => {
  return await fs.writeFile(path, stringify(matter, content));
};
