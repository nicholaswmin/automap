import { process } from '../bus/index.js'
import histogram from '../histogram/index.js'

const run = async (taskFn, {
  before = async () => {},
  after =  async () => {}
} = {}
) => {
  const parameters = Object.freeze(JSON.parse(process.env.parameters))
  const timed_task = performance.timerify(taskFn.bind(this))
  const task = (parameters => timed_task(parameters))
  const observer = new PerformanceObserver(list => {
    list.getEntries().map(entry => ({ 
      ...entry.toJSON(), 
      name: entry.name.replace('bound ', '').trim(),
      duration: Math.ceil(entry.duration)
    }))
    .forEach(entry => histogram(entry.name).record(entry.duration))

    performance.clearMeasures()
    performance.clearResourceTimings()
  })

  process.on('process:disconnect', () => {
    process.stop()
    process.disconnect()
  })
  
  process.on('task:start', () => {
    task(parameters)
  }) 
  
  observer.observe({ entryTypes: ['function'] })
}

export default run
