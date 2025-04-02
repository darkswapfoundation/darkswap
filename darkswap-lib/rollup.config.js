import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

const production = !process.env.ROLLUP_WATCH;

export default [
  // CommonJS (for Node) and ES module (for bundlers) build
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        exports: 'named',
      },
    ],
    plugins: [
      // Allow json resolution
      json(),
      
      // Allow node_modules resolution
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      
      // Allow bundling cjs modules
      commonjs(),
      
      // Compile TypeScript files
      typescript({ tsconfig: './tsconfig.json' }),
      
      // Minify in production
      production && terser(),
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
  },
  
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()],
  },
];