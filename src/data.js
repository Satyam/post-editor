import { readJson, writeJson, join } from './utils';

const fs = Neutralino.filesystem;

const HEXO_DIR = '../roxygrabber/hexo';
// export const HEXO_FILES_LIST = join(HEXO_DIR, 'files.json');
export const SRC_PAGES_DIR = join(HEXO_DIR, 'source');
export const HEXO_IMG_DIR = join(SRC_PAGES_DIR, 'assets/img');
export const DRAFTS_DIR = 'resources/drafts';
const DRAFTS_INFO = join(DRAFTS_DIR, 'info.json');
export const EDITOR_IMG_DIR = 'resources/assets/img';

export let fileName;
export let isPost = false;
export let isDraft = false;

let info;

export const setFileName = (fn = null) => (fileName = fn);

export const getCategories = () => info.categories;
export const getTags = () => info.tags;
export const getAuthors = () => info.authors;
export const getPages = () => info.pages;
export const getPosts = () => info.posts;
export const getDraftPages = () => info.draftPages;
export const getDraftPosts = () => info.draftPosts;

export const saveInfo = () => writeJson(DRAFTS_INFO, info);

export const removeDraftInfo = (file) => {
  if (isPost) {
    info.draftsPosts = info.draftsPosts.filter((data) => data.file !== file);
  } else {
    info.draftsPages = info.draftsPages.filter((data) => data.file !== file);
  }
  saveInfo();
};

export const setMdType = (post = false, draft = false) => {
  isPost = post;
  isDraft = draft;
};

export const loadInfo = async () => {
  const info = await readJson(DRAFTS_INFO);

  pages = info.pages;
  posts = info.posts;
  categories = info.categories;
  tags = info.tags;
  authors = info.authors;
  draftsPages = info.draftsPages ?? [];
  draftPosts = info.draftPosts ?? [];
};
