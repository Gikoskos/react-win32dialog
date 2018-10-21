import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import { plugin as analyze } from 'rollup-plugin-analyzer'
import minify from 'rollup-plugin-babel-minify'
import gzip from 'rollup-plugin-gzip'

import pkg from './package.json'

export default {
    input: 'src/index.js',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true
        }
    ],
    plugins: [
        external(),
        postcss({
            inject: true,
            use: ['sass'],
            minimize: true,
        }),
        url(),
        babel({
            exclude: 'node_modules/**',
            plugins: [ 'external-helpers' ]
        }),
        resolve(),
        commonjs(),
        analyze(),
        minify({
            comments: false,
            sourceMap: false,
            evaluate: true,
            guards: true,
            mangle: true,
            booleans: true,
            removeConsole: true,
            flipComparisons: true,
            deadcode: true,
            builtIns: true,
        }),
        gzip(),
    ]
}
