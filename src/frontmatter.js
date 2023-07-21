import YAML from 'yaml';

const sepRx = /^---\n(?<fm>.*)\n---\s*(?<content>.*)$/s;

export const parse = (str) => {
  const m = str.match(sepRx);
  if (!m) return m;
  const { fm, content } = m.groups;
  const matter = YAML.parse(fm);
  return { content, matter };
};

export const stringify = (matter, content) => `---
${YAML.stringify(matter)}
---
${content}`;
