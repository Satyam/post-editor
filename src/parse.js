const sepRx = /^---\n(?<fm>.*)\n---\s*(?<content>.*)$/s;
const lineRx = /^\s*(?<prop>\w+):\s*(?<value>.*)\s*$/m;
const parse = (str) => {
  const m = str.match(sepRx);
  if (!m) return m;
  const { fm, content } = m.groups;
  const matter = fm.split('\n').reduce((fms, line) => {
    const l = line.match(lineRx);
    if (!l) return fms;
    const { prop, value } = l.groups;
    return {
      ...fms,
      [prop]: value,
    };
  }, {});
  return { content, matter };
};

export default parse;
