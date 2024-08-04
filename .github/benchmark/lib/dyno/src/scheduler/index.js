// Sends commands to run tasks to threads
// 
// - Can send `> 10k tasks per second`, if desired
// - Expect a `~ -10% deviation` from the set `tasksSecond` value, 
//   i.e: `tasksSecond: 100` for `10 seconds` will dispatch `~ 900 tasks` 
//   instead of `1000 tasks`. 

import { validatePositiveInteger } from './validators.js'
import histogram from '../histogram/index.js'

let taskno = 0
let threads = {}

const sendToRandom = async (vthreads, tasksSecond) => {
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
    const threads = Object.values(vthreads)
    const random = threads[Math.floor(Math.random() * threads.length)]

    random && random.connected 
      ? random.send({ name: 'task:start', taskno: ++taskno }) 
        ? histogram('sent').record(1)
        : (() => {
          throw new Error('Task IPC oversaturated. Set lower: "tasksSecond"')
        })
      : false
  }
}

const scheduler = () => {
  const recordTaskFinish = ({ name }) => (['task:finished'].includes(name)) 
    ?  histogram('finished').record(1) 
    : 0

  let threads = []
  let timer = null 
  
  return {
    start: function(vthreads, tasksSecond) {
      tasksSecond = validatePositiveInteger(tasksSecond, 'tasksSecond')

      threads = Object.values(vthreads).map(thread => {
        thread.on('message', recordTaskFinish)

        return thread
      })

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
            sendToRandom.bind(null, vthreads, tasksSecond),
            Math.round(1000 / tasksSecond)
          )
    },

    stop: function() {
      return timer 
        ? (() => {
            process.stop()

            threads.forEach(thread => 
              thread.off('task:finished', recordTaskFinish))

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
