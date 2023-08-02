import { join } from './utils';
import { parse, stringify } from './frontmatter';
import { isPost, isDraft, fileName, SRC_PAGES_DIR, DRAFTS_DIR } from './data';

const fs = Neutralino.filesystem;

const fullFileName = () => {
  if (isDraft) {
    return join(DRAFTS_DIR, isPost ? 'posts' : 'pages', fileName);
  } else {
    return join(SRC_PAGES_DIR, isPost ? '_posts' : '', fileName);
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
    console.log('remove', fileName);
    debugger;

    return;
  }
};

export const saveMD = async (matter, content) =>
  await fs.writeFile(fullFileName(), stringify(matter, content));
