import { expect, test } from 'vitest'
import transformModulesToCommonjs from '.'

const code = `
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

test('transformModulesToCommonjs', () => {
  const result = transformModulesToCommonjs(code)
  expect(result).toMatchSnapshot()
})
