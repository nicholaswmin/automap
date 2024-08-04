import run from './task/index.js'

run(async function task(parameters) {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const timed_sleep = performance.timerify(sleep)
  
  await timed_sleep(Math.round(Math.random() * parameters.RAND_FACTOR))
})
