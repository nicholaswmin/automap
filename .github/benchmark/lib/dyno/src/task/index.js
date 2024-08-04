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
  const parameters = Object.freeze(JSON.parse(process.env.parameters))

  const timed_task = performance.timerify(taskFn.bind(this))
  const taskRunner = (parameters => timed_task(parameters))

  const loopObserver = new LoopDelayObserver(histogram('evt_loop').record)
  const perfObserver = new PerformanceObserver(mapToEntries(entry => {
    return histogram(entry.name).record(entry.duration)
  }))
    
  await before(parameters)
  
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
  }) 
  
  loopObserver.observe()
  perfObserver.observe({ entryTypes: ['function', 'gc', 'node'] })
}

export default run
