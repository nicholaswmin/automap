import timer from 'timers/promises'

import Table from './src/views/table/index.js'
import Plot from './src/views/plot/index.js'

import run from './src/task/index.js'
import prompt from './src/prompt/index.js'
import Uptimer from './src/uptimer/index.js'
import threader from './src/threader/index.js'
import Collector from './src/collector/index.js'
import Scheduler from './src/scheduler/index.js'


const dyno = async ({ task, parameters, render = () => {} }) => {
  parameters = await prompt(parameters)

  const abortctrl = new AbortController()
  const collector = new Collector()
  const scheduler = new Scheduler({ perSecond: parameters.TASKS_PER_SECOND })
  const uptimer = new Uptimer()
  const threads = await threader.fork(task, { 
    count: parameters.THREAD_COUNT,
    parameters
  })
  
  collector.start(threads, render.bind(this))
  scheduler.start(threads, parameters.TASKS_PER_SECOND)
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

export { dyno, run, Table, Plot }
