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
export const getDraftPages = () => info.draftPages ?? [];
export const getDraftPosts = () => info.draftPosts ?? [];

export const saveInfo = () => writeJson(DRAFTS_INFO, info);

export const removeDraftInfo = async () => {
  if (isPost) {
    info.draftsPosts = info.draftsPosts.filter(
      (data) => data.file !== fileName
    );
  } else {
    info.draftsPages = info.draftsPages.filter(
      (data) => data.file !== fileName
    );
  }
  await saveInfo();
};

export const addDraftInfo = async (fileInfo) => {
  const newInfo = {
    ...fileInfo,
    file: fileName,
  };
  if (isPost) {
    if (
      !info.draftPosts.some((p) => {
        if (p.file === fileName) {
          p = newInfo;
          return true;
        }
      })
    ) {
      info.draftPosts.push(newInfo);
    }
  } else {
    if (
      !info.draftPages.some((p) => {
        if (p.file === fileName) {
          p = newInfo;
          return true;
        }
      })
    ) {
      info.draftPages.push(newInfo);
    }
  }
  await saveInfo();
};

export const setMdType = (post = false, draft = false) => {
  isPost = post;
  isDraft = draft;
};

const INFO_PROPS = [
  'pages',
  'posts',
  'categories',
  'tags',
  'authors',
  'draftPages',
  'draftPosts',
];
export const loadInfo = async () => {
  info = await readJson(DRAFTS_INFO);
  INFO_PROPS.forEach((p) => {
    if (!info[p]) info[p] = [];
  });
};
