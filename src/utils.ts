export class StringOperator {
  origin: string
  result: string
  lastStart: number
  _append: string = ''
  _prepend: string = ''
  constructor(s: string) {
    this.result = ''
    this.origin = s
    this.lastStart = 0
  }
  set(index: number, newLastStart: number, content: string) {
    const prefix = this.origin.slice(this.lastStart, index)
    if (prefix) {
      this.result += prefix
    }
    this.lastStart = newLastStart
    this.result += content
  }

  toString() {
    const rest = this.origin.slice(this.lastStart, this.origin.length)
    if (rest) {
      this.result += rest
    }
    return this._prepend + this.result + this._append
  }

  update(start: number, end: number, content: string) {
    this.set(start, end, content)
  }
  append(content: string) {
    this._append += content
  }
  appendLeft(index: number, content: string) {
    this.set(index, index, content)
  }
  appendRight(index: number, content: string) {
    this.set(index + 1, index + 1, content)
  }
  remove(start: number, end: number) {
    this.lastStart = start
    this.set(start, end, '')
  }
  prepend(content: string) {
    this._prepend = content + this._prepend
  }
}
