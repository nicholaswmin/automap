import { process } from '../bus/index.js'
import histogram from '../histogram/index.js'
import { 
  LoopDelayObserver, 
  mapToEntries 
} from './perf_hook-helpers/index.js'

const run = async (taskFn, {
  before = async () => {},
  after =  async () => {}
} = {}) => {
  await before(parameters)

  const parameters = Object.freeze(JSON.parse(process.env.parameters))
  const loopObserver = new LoopDelayObserver(histogram('evt_loop').record)
  const perfObserver = new PerformanceObserver(mapToEntries(entry => {
    return histogram(entry.name).record(entry.duration)
  }))
  
  const timed_task = performance.timerify(taskFn.bind(this))
  const taskRunner = parameters => timed_task(parameters)
  
  process.on('process:disconnect', async () => {
    await after(parameters)

    loopObserver.disconnect()
    perfObserver.disconnect()
    histogram().stop()

    process.stop()
    process.disconnect()
  })
  
  process.on('task:start', () => {
    taskRunner(parameters)
      .then(() => process.send({ 
        name: 'task:finished' 
      }))
  }) 
  
  loopObserver.observe()
  perfObserver.observe({ 
    entryTypes: ['function'] 
  })
}

export default run
