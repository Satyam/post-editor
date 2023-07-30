import { readJson, writeJson, join } from './utils';
import { imagesToEditor } from './images';

const fs = Neutralino.filesystem;

export let drafts;
export let pages;
export let posts;
export let categories;
export let tags;
export let authors;

export const load = async () => {
  const { json } = await readJson(NL_HEXO_FILES_LIST);

  pages = json.pages;
  posts = json.posts;
  categories = json.categories;
  tags = json.tags;
  authors = json.authors;

  drafts = await readJson(NL_DRAFTS_INFO, { pages: [], posts: [] });

  await imagesToEditor();
};

export const saveDrafts = () => writeJson(NL_DRAFTS_INFO, drafts);

const draftsDirRx = new RegExp(`^${NL_DRAFTS_DIR}/`);
const srcDirRx = new RegExp(`^${NL_SRC_PAGES_DIR}/`);

export const removePost = async (fileName, isDraft, isPost) => {
  if (isDraft) {
    await fs.removeFile(fileName);
    const fn = fileName.replace(draftsDirRx, '');
    if (isPost) {
      drafts.posts = drafts.posts.filter((data) => data.file !== fn);
    } else {
      drafts.pages = drafts.pages.filter((data) => data.file !== fn);
    }
    await saveDrafts();
  } else {
    let which = isPost ? posts : pages;
    const fn = fileName.replace(srcDirRx, '');
    which = which.filter((data) => data.file !== fn);
    /// TODO
    console.log('remove', fileName);
    debugger;

    return;
    await fs.removeFile(fileName);
    await writeJson(NL_HEXO_FILES_LIST, {
      pages,
      posts,
      categories,
      tags,
      authors,
    });
  }
};
