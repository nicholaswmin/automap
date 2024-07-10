import { styleText as c } from 'node:util'
import ioredis from 'ioredis'

const redis = new ioredis()

redis.on('connect', () => redis.disconnect())
redis.on('error', () => {
  console.info(c('cyan', `These tests require a locally running Redis server`))
  console.error(c('red', `Error: cannot find a Redis server running at :6379`))
  process.exit(1)
})
