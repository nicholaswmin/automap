import { styleText as c } from 'node:util'
import ioredis from 'ioredis'

const redis = new ioredis({ maxRetriesPerRequest: 0 })

redis.on('connect', redis.disconnect)
redis.on('error', err => {
  console.error(c('red', `Redis ${err.toString()}`))
  console.warn(c('yellow', `These tests require a Redis server running @:6379`))

  redis.disconnect()
  process.exit(1)
})
