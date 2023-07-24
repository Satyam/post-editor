import { readJson, writeJson } from './utils';
import { imagesToEditor } from './images';

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
