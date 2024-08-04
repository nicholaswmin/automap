import timer from 'timers/promises'
import prompt from './prompt/index.js'
import Uptimer from './uptimer/index.js'
import threader from './threader/index.js'
import Collector from './collector/index.js'
import Scheduler from './scheduler/index.js'

const dyno = async ({ task, parameters, render = () => {} }) => {
  parameters = await prompt(parameters)

  const abortctrl = new AbortController()
  const collector = new Collector()
  const scheduler = Scheduler()
  const uptimer = new Uptimer()
  const threads = await threader.fork(task, { 
    count: parameters.THREAD_COUNT,
    parameters
  })
  
  collector.start(threads, render.bind(this))
  scheduler.start(threads, parameters.TASKS_SECOND)
  uptimer.start()

  try {
    await Promise.race([
      threader.watch(threads, abortctrl),
      timer.setTimeout(parameters.TEST_SECONDS * 1000, null, abortctrl)
    ])
  } finally {
    abortctrl.abort()
    uptimer.stop()
    scheduler.stop()
    collector.stop()

    await threader.disconnect(threads)
  }
}

export { dyno }
