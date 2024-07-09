import { flatten, expand } from './map.js'

class Repository {
  constructor(Class, redis) {
    this.Class = Class
    this.redis = redis

    // Usage: `const res = await this.redis.hmgetall(2, 'hash1', 'hash2')`
    this.redis.defineCommand('hmgetall', {
      lua: `local r = {} for _, v in pairs(KEYS) do r[#r+1] = redis.call('HGETALL', v) end return r`
    })

    this.loaders = {
      string: {
        get: key => {
          return this.redis.get(key)
            .then(data => data ? JSON.parse(data) : null)
        },

        set: (key, value) => {
          return this.redis.set(key, value)
        }
      },

      hash: {
        getMany: async (keys = []) => {
          // ???? wtf
          return this.redis.hmgetall(keys.length, ...keys)
            .then(hashes => hashes.map(hash =>
              hash.filter(field => field.startsWith('{'))
                .map(JSON.parse)
                  .sort((a, b) => a.i - b.i)
                    .map(item => item.json)))
        },

        getField: (key, field) => {
          return this.redis.hget(key, field)
            .then(data => data ? JSON.parse(data) : null)
        },

        get: key => {
          return this.redis.hgetall(key)
            .then(hash => Object.keys(hash)
            .map(key => JSON.parse(hash[key]))
            .sort((a, b) => a.i - b.i)
            .map(item => item.json))
        },

        set: (key, value) => {
          return this.redis.hset(key, value)
        }
      },

      list: {
        getMany: (keys = []) => {
          const pipeline = keys.reduce((promise, key) => {
            return promise.lrange(key, 0, -1)
              .then(res => res.map(JSON.parse))
          }, this.redis.pipeline())

          return pipeline.exec()
        },

        get: key => {
          return this.redis.lrange(key, 0, -1).then(res => res.map(JSON.parse))
        },

        set: (key, value) => {
          return this.redis.rpush(item.key, item.value)
        }
      }
    }
  }

  save(root) {
    const flat = flatten(root)
    const transaction = flat.lists.reduce((promise, item) => {
      return item.type === 'list' ?
        promise.rpush(item.key, item.value) :
        promise.hset(item.key, item.value)
    }, this.redis.multi().set(flat.root.key, flat.root.value))

    return transaction.exec()
  }

  async fetch({ id }) {
    const key = this.Class.name.toLowerCase() + ':' + id
    const root = await this.loaders.string.get(key)

    if (!root)
      return null

    const expandedData = await expand(root, async subs => {
      const hashSubs = subs.filter(sub => sub.traits.type === 'hash')
      const listSubs = subs.filter(sub => sub.traits.type === 'list')

      const hashSubsWithItems = await this.loaders['hash']
        .getMany(hashSubs.map(sub => sub.path))
        .then(items => hashSubs.map((sub, i) => ({ ...sub, items: items[i] })))

      const listSubsWithItems = await this.loaders['list']
        .getMany(listSubs.map(sub => sub.path))
        .then(items => listSubs.map((sub, i) => ({ ...sub, items: items[i] })))

      return [...hashSubsWithItems, ...listSubsWithItems]
    })

    return new this.Class(expandedData)
  }

  async fetchHashField({ id, parentId }) {
    const root = await this.loaders.hash.getField(parentId, id)

    if (!root)
      Repository.createChildResourceNotFoundError(parentId, id)

    const data = await expand(root, this.loaders)

    return new this.Class(data.json)
  }

  static createChildResourceNotFoundError(parentId, id) {
    throw new Error(`Cannot find child resource: ${id} of parent: ${parentId}`)
  }
}

export { Repository }
