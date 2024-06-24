import { flatten, expand } from './map.js'

class Repository {
  constructor(Class, redis) {
    this.Class = Class
    this.redis = redis
    this.loaders = {
      key: {
        get: key => {
          return this.redis.get(key)
            .then(data => data ? JSON.parse(data) : null)
        },

        set: (key, value) => {
          return this.redis.set(key, value)
        }
      },

      hash: {
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
    const transaction = flat.list.exportForSave().reduce((promise, item) => {
      return item.type === 'list' ?
        promise.rpush(item.key, item.value) :
        promise.hset(item.key, item.value)
    }, this.redis.multi().set(flat.root.key, flat.root.value))

    return transaction.exec()
  }

  async fetch({ id }) {
    const root = await this.loaders.key.get(id)

    if (!root)
      Repository.createResourceNotFoundError(id)

    const data = await expand(root, async ({ path, traits }) => {
      return this.loaders[traits.type].get(path)
    })

    return new this.Class(data)
  }

  async fetchHashField({ id, parentId }) {
    const root = await this.loaders.hash.getField(parentId, id)

    if (!root)
      Repository.createChildResourceNotFoundError(parentId, id)

    const data = await expand(root, this.loaders)

    return new this.Class(data.json)
  }

  static createResourceNotFoundError(id) {
    throw new Error(`Cannot find mapped resource: ${id}`)
  }

  static createChildResourceNotFoundError(parentId, id) {
    throw new Error(`Cannot find child resource: ${id} of parent: ${parentId}`)
  }
}

export { Repository }
