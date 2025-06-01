# transform-modules-to-commonjs

transfrom `import` to `require`.

# usage

## install

```bash
npm i transform-modules-to-commonjs
```

## sample

```js
import transformModulesToCommonjs from 'transform-modules-to-commonjs'

const module = `
import React, { useEffect } from 'react'
import data from './bar.json' with { type: 'json' }
import * as vue from 'vue'

export default async function App() {
  const yaml = await import('yaml')
  return <div>app</div>
}

const foo: string = 'bar'
export { foo }

export const c = ''
`.trim()

transformModulesToCommonjs(module)
```

output:

```js
let __require__=(...args)=>new Promise((r)=>r(require(...args)));
let React=require('react');let {useEffect}=require('react');
let data=require('./bar.json');
let vue=require('vue');

exports. default= async function App() {
  const yaml = await __require__('yaml')
  return <div>app</div>
}

const foo: string = 'bar'
exports.foo=foo;

exports.c=c;
```

# why build this repo

[oxc](https://github.com/oxc-project/oxc) only transfrom code esm format, commonjs is not planned, see https://github.com/oxc-project/oxc/issues/4050.

commonjs is easy to run with `Function` or `eval`, this is useful for live react/vue component. For example:

```js
import React from 'react'

const commonjs = `
const React = require('react')
exports.default = function() {
  return React.createElement('div', 'app')
}`

const fn = new Function('exports', 'require', commonjs)
const scope = {
  react: React,
}
const exports = {}
fn(exports, (key) => scope[key])
console.log(exports.default) // will be react component
```
