import { nodeResolve } from '@rollup/plugin-node-resolve';
export default {
  input: 'src/main.js',
  output: {
    file: 'resources/js/main.js',
    format: 'cjs',
  },
  plugins: [nodeResolve()],
};
