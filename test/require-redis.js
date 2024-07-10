import { styleText as c } from 'node:util'
import ioredis from 'ioredis'

const redis = new ioredis()

redis.on('connect', () => redis.disconnect())
redis.on('error', () => {
  console.error(c('red', 'Error: these tests require Redis running at :6379'))
  process.exit(1)
})
