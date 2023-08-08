import { dispatch, on, EVENT } from './events';

export let fileName = null;
export let isPost = false;
export let isDraft = false;
export let isNew = false;

export const setMdType = (post = false, draft = false, _new = false) => {
  isPost = post;
  isDraft = draft;
  isNew = _new;
  dispatch(EVENT.STATE_CHANGED);
};

export const setFileName = (fn = null) => {
  fileName = fn;
  dispatch(EVENT.STATE_CHANGED);
};

on(EVENT.EDITOR_CHANGED, () => {
  dispatch(EVENT.STATE_CHANGED);
});
