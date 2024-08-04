import run from './task/index.js'

run(async function task(parameters) {
  const sleep = (ms = 100) => new Promise(r => setTimeout(r, ms))

  await sleep(Math.round(Math.random() * parameters.RAND_FACTOR))
})
