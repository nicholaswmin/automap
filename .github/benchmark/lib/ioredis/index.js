import ioredis from 'ioredis'

export default () => {
  return new ioredis(process.env.REDIS_URL, {
    keyPrefix: 'test:',
    tls: process.env.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })
}
