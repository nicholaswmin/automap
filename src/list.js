class List extends Array {
  static traits = { type: 'hash' }

  #type // eslint-disable-line no-unused-private-class-members

  constructor(...args) {

    if (args[0] && Object.hasOwn(args[0], 'from')) {
      const opts = args.pop()

      if (!Object.hasOwn(opts, 'from'))
        throw new Error('items must be specified when creating a List')

      const items = Array.isArray(opts.from) ?
        (opts.type ? opts.from.map(item => new opts.type(item)) : opts.from) :
        []

      super(...items)

      this.loaded = true
      this.#type = opts.type

      return
    }

    super(...args)
  }

  load() { } // noop

  exportForSave() {
    return {
      type: this.constructor.traits.type,
      value: this.reduce((acc, item, i) => {
        return { ...acc, [item.id]: JSON.stringify({ i, json: item }) }
      }, {})
    }
  }
}

class LazyList extends List {
  static traits = { type: 'hash', lazy: true }

  #path
  #type

  constructor(...args) {
    super(...args)

    const opts = args[0]?.from ? args[0] : null

    this.loaded = false
    this.#type = opts?.type
    this.#path = opts?.from?.split?.(' ')[0] || null
  }

  async load(repository) {
    if (!repository)
      throw new Error('Must pass a repository instance when calling .load()')

    const type = this.constructor.traits.type
    const loader = repository.loaders[type]

    if (!loader)
      throw new Error(`Cannot find loader of type: ${type} in repo`)

    const items =  await loader.get(this.#path)

    items.reverse()
      .map(item => new this.#type(item))
      .forEach(item => this.splice(0, 0, item))

    this.loaded = true
  }
}

class AppendList extends LazyList {
  static traits = { type: 'list', lazy: true, append: true }

  constructor(...args) {
    super(...args)
    this.additions = []
  }

  exportForSave() {
    return {
      type: this.constructor.traits.type,
      value: this.additions.map(JSON.stringify)
    }
  }

  push(...args) {
    this.additions.push(...args)

    super.push(...args)
  }
}

export { List, LazyList, AppendList }
