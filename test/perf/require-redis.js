import ioredis from 'ioredis'

const redis = new ioredis()

redis.on('connect', () => redis.disconnect())
redis.on('error', () => {
  console.error('\x1b[31m These tests require a Redis server running at :6379')
  process.exit(1)
})
