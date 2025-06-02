import oxc from 'oxc-parser'
import MagicString from 'magic-string'

function buildRequireDeclaration(
  name: string,
  source: string,
  isDefaultImport: boolean,
  withRequire = true,
) {
  name = isDefaultImport ? name : `{${name}}`
  const right = withRequire ? `require('${source}')` : source
  return `let ${name}=${right};`
}

function transformModulesToCommonjs(
  code: string,
  lang: 'js' | 'jsx' | 'ts' | 'tsx' = 'tsx',
) {
  const ms = new MagicString(code)
  const ast = oxc.parseSync('es', code, {
    lang,
  })
  const moudle = ast.module
  const { staticImports, staticExports, dynamicImports } = moudle

  if (dynamicImports.length > 0) {
    const inject =
      'let __require__=(...args)=>new Promise((r)=>r(require(...args)));\n'
    ms.prepend(inject)
  }
  for (const { start, end, moduleRequest } of dynamicImports) {
    const module = code.slice(moduleRequest.start, moduleRequest.end)
    ms.update(start, end, `__require__(${module})`)
  }
  const moduleSet = new Map<string, string>()
  for (const staticImport of staticImports) {
    let defaultImportStr = ''
    const namedImports: string[] = []
    let importSource = staticImport.moduleRequest.value
    let cachelocalname = moduleSet.get(importSource)
    let withRequire = !cachelocalname
    for (const { importName, localName, isType } of staticImport.entries) {
      if (isType || localName == null) {
        continue
      }
      if (!cachelocalname) {
        moduleSet.set(importSource, localName.value)
      }
      const importKind = importName.kind
      // import React from 'react'
      // import * as React from 'react'
      if (importKind === 'Default' || importKind === 'NamespaceObject') {
        importSource = localName.value
        const requireStr = buildRequireDeclaration(
          localName.value,
          importSource,
          true,
          withRequire,
        )
        withRequire = false
        defaultImportStr += requireStr
      }
      // import { useEffect } from 'react'
      else if (importKind === 'Name') {
        let value = localName.value
        // import { useEffect as effect } from 'react'
        if (importName.name && importName.name !== value) {
          value = `${importName.name}: ${localName.value}`
        }
        namedImports.push(value)
      }
    }
    const namedMembers = namedImports.join(',')
    const namedImportStr = namedMembers.trim()
      ? buildRequireDeclaration(namedMembers, importSource, false, withRequire)
      : ''
    ms.update(
      staticImport.start,
      staticImport.end,
      defaultImportStr + namedImportStr,
    )
  }
  for (const staticExport of staticExports) {
    for (const {
      exportName,
      importName,
      localName,
      isType,
    } of staticExport.entries) {
      if (isType) {
        continue
      }
      const exportKind = exportName.kind
      const importKind = importName.kind
      /**
       * ignore
       * export * from "mod"
       * export * as ns from "mod"
       * export { xxx } from 'mod'
       */
      if (importKind === 'None') {
        if (exportKind === 'Default') {
          if (exportName.start == null || exportName.end == null) {
            continue
          }
          /**
           * localName.kind === 'Name'
           * export default function a() {}
           */
          /**
           * localName.kind === 'None'
           * export default function() {}
           */
          /**
           * localName.kind === 'Default'
           * exprt default App
           */
          ms.appendLeft(
            staticExport.start + exportName.end - exportName.start - 1,
            's.',
          )
          ms.appendRight(exportName.end, '=')
        } else if (exportKind === 'Name') {
          ms.update(
            staticExport.start,
            staticExport.end,
            `exports.${exportName.name}=${localName.name};`,
          )
        }
      }
    }
  }
  return ms.toString()
}

export default transformModulesToCommonjs
