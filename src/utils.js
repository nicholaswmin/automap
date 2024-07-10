import crypto from 'node:crypto'
import ioredis from 'ioredis'
import ioredisMock from 'ioredis-mock'

// Number

const round = num => Math.round((num + Number.EPSILON) * 100) / 100

// Randoms

const randomID = () => crypto.randomUUID().split('-').at(-1)
const randomNum = (min = -300, max = 600) =>
  round(Math.random() * (max - min) + min)

// Payload

const payloadKB = kb => {
  return JSON.stringify({
    ...JSON.parse(`["Path",{"applyMatrix":true,"data":{"guid":"${randomID()}"},"segments":[${`[${randomNum()}, ${randomNum()}]`}],"strokeColor":[0.6141276000612308,0.0073291996604683, 0.20695908748200353],"strokeWidth":2,"strokeCap":"round","strokeJoin":"round"}]`),
    segments: Array.from({
      length: 63 * kb
    }, () => [ randomNum(), randomNum() ])
  })
}

// size value converter

const toMB = bytes => round(bytes / 1000 / 1000)

// Size of

const sizeKB = item => round(sizeBytes(item) / 1000)
const sizeBytes = item => {
  if (typeof item === 'undefined' || !item)
    throw new Error('passed item is falsy')

  const str = typeof item === 'string' ? item : JSON.stringify(item)

  return round(new Blob([str]).size)
}

// Redis

const delObjectGraph = (redis, id) =>
  redis.keys(id + ':*').then(keys =>
    keys.reduce((ppl, id) => ppl.del(id), redis.pipeline().del(id)).exec())

const createRedis = () => ['development', undefined]
  .includes(process.env.NODE_ENV) ?
    new ioredis() :
    new ioredis({
      url: process.env.REDIS_URL,
      tlsOptions: { tls: { rejectUnauthorized: false } }
    })


const utils = {
  ioredis: { mock: ioredisMock, real: createRedis },
  delObjectGraph,

  round,

  randomID,
  randomNum,

  payloadKB,

  toMB,

  sizeKB
}

export { utils }
