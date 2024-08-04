// Sends commands to run tasks to threads
// 
// - Can send `> 10k tasks per second`, if desired
// - Expect a `~ -10% deviation` from the set `tasksSecond` value, 
//   i.e: `tasksSecond: 100` for `10 seconds` will dispatch `~ 900 tasks` 
//   instead of `1000 tasks`. 

import { validatePositiveInteger } from './validators.js'

let taskno = 0

const sendToRandom = async (threads, tasksSecond) => {
  // - If calculated `interval < 1ms`, which is the minimum possible 
  //   `setInterval()` duration, we create additional synthetic/filler 
  //    `process.send` calls to match the desired send rate.
  // 
  // @WARNING: 
  // - If `tasksPerSecond > 1000`, it has to be set as multiples of  `1000`, 
  //   otherwise `fillerCycles` won't be able to correctly fill the remainder.       
  const fracInterval = 1000 / tasksSecond
  const fillerCycles = Math.ceil(1 / fracInterval)

  for (let i = 0; i < fillerCycles; i++) {
    const vthreads = Object.values(threads)
    const random = vthreads[Math.floor(Math.random() * vthreads.length)]

    random && random.connected 
      ? random.send({ name: 'task:start', taskno: ++taskno }) 
        ? true
        : (() => {
          throw new Error('Task IPC oversaturated. Set lower: "tasksSecond"')
        })
      : false
  }
}

const scheduler = () => {
  let timer = null 
  
  return {
    start: function(threads, tasksSecond) {
      tasksSecond = validatePositiveInteger(tasksSecond, 'tasksSecond')

      if (tasksSecond > 10000)
        throw new RangeError(`tasksSecond must be <= 10000, is: ${tasksSecond}`)

      if (tasksSecond > 1000 && tasksSecond % 1000 > 0)
        throw new RangeError(
          `tasksSecond must be multiples of 1000 if > 1000, is: ${tasksSecond}`
        )
      
      return timer 
        ? (() => {
            throw new TypeError('cannot start() an already running Scheduler')
          })()
        : timer = setInterval(
            sendToRandom.bind(null, threads, tasksSecond),
            Math.round(1000 / tasksSecond)
          )
    },

    stop: function() {
      return timer 
        ? (() => {
            clearInterval(timer)
            timer = null
          })()
        : (() => {
          throw new TypeError('cannot stop() an already stopped Scheduler')
        })()
    }
  }
}

export default scheduler
