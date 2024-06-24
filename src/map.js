import { traverse, getNodeByPath } from 'object-traversal'
import { setPathValue } from 'pathval'

import dot from 'dot-object'

import { List } from './list.js'

const expand = async (root, cb) => {
  const substitutions = []

  traverse(root, ({ key, value, meta }) => {
    if (!value?.includes?.(':')) return

    const [ path, traitsJSON ] = value.split(' ')
    const { nodePath } = meta
    const traits = JSON.parse(traitsJSON)

    if (traits.lazy)
      return

    substitutions.push({ path, nodePath, traits })
  })

  for (const sub of substitutions) {
    const items = await cb(sub)

    setPathValue(root, sub.nodePath, items)

    return expand(root, cb)
  }

  return root // @FIXME might be broken, dont trust this
}

const flatten = root =>  {
  const branches = []

  traverse(root, ({ value, meta }) => {
    if (!(value instanceof List))
      return

    const branch = branches[0]
    const lastnode = branch?.[0]
    const node = new Node({ root, dotpath: meta.nodePath })

    return lastnode?.isAncestorOrSibling(node) ?
      branch.unshift(node) : branches.unshift([ node ])
  })

  return {
    list: new Nodelist(
      branches.flat().map(node => node.captureValue())
      .filter(node => node.hasItems())
      .flat(10) // nothing special on this magic number, just ensuring its flat
    ),
    root: {
      key: root.constructor.name.toLowerCase().trim() + ':' + root.id.trim(),
      value: JSON.stringify(root)
    }
  }
}

class Nodelist extends Array {
  constructor(...args) {
    super(...args.flat())
  }

  exportForSave() {
    return this.map(node => node.value)
  }
}

class Node {
  #root

  constructor({ root, dotpath }) {
    this.#root = root

    this.dotpath = dotpath
    this.storepath = this.#getRootpath() + this.#storepathFromDotpath(dotpath)
    this.value = null
  }

  captureValue() {
    const prop = this.dotpath.split('.').pop()
    const result = { [prop]: this.storepath }

    dot.transfer(this.dotpath, 'value', this.#root, result)

    const traits = result.value.constructor.traits
    result[prop] = this.storepath + ' ' + JSON.stringify(traits)

    dot.copy(prop, this.dotpath, result, this.#root)

    this.value = result.value.exportForSave(this.storepath)

    return this
  }

  hasItems() {
    return Array.isArray(this.value) ? !!this.value.length : !!this.value
  }

  isAncestorOrSibling(node) {
    const myRoutepath = this.#routepathFromDotpath(this.dotpath)
    const otherRoutepath = this.#routepathFromDotpath(node.dotpath)

    return otherRoutepath.includes(myRoutepath)
  }

  #storepathFromDotpath (dotpath) {
    return dotpath.split('.').reduce((current, dotpart, i, arr) => {
      const indexpath = current.indexpath + ( i ? '.' : '') + dotpart
      const curritem = getNodeByPath(this.#root, indexpath)
      const id = curritem.id || dotpart
      const idAtIndex = Array.isArray(curritem) ? dotpart : id
      const storepath = current.storepath + ( i ? ':' : '' ) + idAtIndex

      return i < arr.length - 1 ?
        { storepath, indexpath } : storepath
    }, { storepath: '', indexpath: '' })
  }

  #routepathFromDotpath(dotpath) {
    return dotpath.split('.')
      .reduce((acc, dotpart, i) =>
        acc += ( i ? '.' : '') + (isNaN(dotpart) ? dotpart : '*'), '')
  }

  #getRootpath() {
    return this.#root.constructor.name.toLowerCase()
      + (this.#root.id ? (':' + this.#root.id) : '' )
      + ':'
  }
}

export { flatten, expand }
