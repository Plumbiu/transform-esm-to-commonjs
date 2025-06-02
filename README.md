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
let __require__ = (...args) => new Promise((r) => r(require(...args)))
let React = require('React')
let { useEffect } = React
let data = require('data')
let vue = require('vue')

exports.default = async function App() {
  const yaml = await __require__('yaml')
  return <div>app</div>
}

const foo: string = 'bar'
exports.foo = foo

exports.c = c
```

# note

The results of this library differ [babel](https://github.com/babel/babel) and [sucrase](https://github.com/alangpierce/sucrase).

Syntax like: `import * as React from 'react'` will be same as `import React from 'react'`.

Part of the reason is that this repository only uses part of the [oxc-parser](https://github.com/oxc-project/oxc) functionality and does not involve AST, and the other part is that this repository is not used for bundle, see the next section to learn more.

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
const scope = {
  react: React,
}
const exports = {}
new Function('exports', 'require', commonjs)(exports, (key) => scope[key])

console.log(exports.default) // will be react component
```

Based on above code, The esm format code like:

```js
import * as React from 'react'
export default function () {
  return React.default.createElement('div', 'bar')
}
```

transfrom to:

```js
const React = require('react')
export default function () {
  return React.default.createElement('div', 'bar')
}
```

To get react component by syntax `import * as React from 'react'`, the code should be:

```js
// just like esm format code import statement
import * as React from 'react'
const scope = {
  react: React,
}

const esmCode = `
import * as React from 'react'
export default function () {
  return React.default.createElement('div', 'bar')
}
`.trim()

const cjsCode = transformModulesToCommonjs(esmCode)
const exports = {}
new Function('exports', 'require', commonjs)(exports, (key) => scope[key])

console.log(exports.default) // react component
```
