import ioredis from 'ioredis'

const rand = () => (Math.random() * 555555).toString().slice(10)

const redis = ['development', null].includes(process.env.NODE_ENV || null) ?
  new ioredis() : new ioredis({
    url: process.env.REDIS_URL,
    tlsOptions: { tls: { rejectUnauthorized: false } }
  })

export { rand, redis }
