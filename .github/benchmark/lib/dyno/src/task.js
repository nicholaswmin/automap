import { styleText as c } from 'node:util'
import { setTimeout } from 'timers/promises'
import { TaskRunner } from './task-runner.js'

import {
  ThreadStatsTracker,
  ThreadObservedStatsTracker
} from './stats/stats-tracker.js'

const task = async (
  taskFn,
  {
    before = async () => {},
    after = async () => {}
  } = {}) => {
  const parameters = Object.freeze(JSON.parse(process.env.PARAMETERS))
  
  const runner = new TaskRunner()

  const stats = {
    general: new ThreadStatsTracker([
      'task', 'memory', 'acked', 'finished', 'backlog'
    ]),
    measures: new ThreadObservedStatsTracker(['function', 'measure', 'gc'])
  }

  before ? await before(parameters) : null

  runner.on('task:finish', async runner => {
    stats.general.task.record(runner.measure.duration)
    stats.general.memory.record(process.memoryUsage().heapUsed)
    stats.general.backlog.record(runner.backlog.length)
    stats.general.finished.tick()

    stats.general.publish()
    stats.measures.publish()
    
    if (process.connected)
      return process.send({ type: 'task:finish' })
  })

  const onRunnerMessage = message => {
    if (message.type === 'shutdown')
      return shutdown(0)

    if (message.type === 'task:start') {
      stats.general.acked.tick()

      runner.enqueue(message.task)

      if (process.connected)
        return process.send({ type: 'task:ack' }, null, { keepOpen: true })
    }

    throw new Error(`Unknown type. Got: ${JSON.stringify(message)}`)
  }

  const shutdown = async (code) => {
    runner.removeAllListeners('task:run')
    runner.stop()
    Object.values(stats).forEach(stat => stat.stop())
    await setTimeout(100)
    after ? await after(parameters) : null
    return process.exit(code)
  }

  const onError = async error => {
    console.log(c(['red'], `error:thread:${process.pid}`))
    console.error(error)
    await shutdown(1)
  }

  process.on('error', onError)
  ;['SIGINT', 'SIGTERM', 'disconnect']
    .forEach(signal => process.on(signal, () => shutdown(0)))

  runner.start(taskFn.bind(this, parameters))

  process.on('message', onRunnerMessage)
}

export default task
