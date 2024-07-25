import { styleText as c } from 'node:util'
import { setTimeout } from 'timers/promises'
import { TaskRunner } from './task-runner.js'

import {
  ThreadStatsTracker,
  ThreadObservedStatsTracker
} from './stats/stats-tracker.js'

const thread = async (taskFn, { after } = {}) => {
  const parameters = JSON.parse(process.env.parameters)
  const runner = new TaskRunner()
  const stats = {
    general: new ThreadStatsTracker(['task', 'memory', 'backlog']),
    functions: new ThreadObservedStatsTracker(['function'])
  }

  runner.on('task:run', async runner => {
    stats.general.task.record(runner.measure.duration)
    stats.general.memory.record(process.memoryUsage().heapUsed)
    stats.general.backlog.record(runner.backlog.length || 1)
    stats.general.publish()
    stats.functions.publish()
  })

  const onPrimaryMessage = message => {
    if (message.type === 'shutdown')
      return shutdown(0)

    if (message.type === 'task:execute') {
      runner.enqueue(message.task)

      if (process.connected)
        return process.send({ type: 'ack' }, null, { keepOpen: true })
    }

    throw new Error(`Unknown type. Got: ${JSON.stringify(message)}`)
  }

  const shutdown = async (code) => {
    runner.removeAllListeners('task:run')
    runner.stop()
    Object.values(stats).forEach(stat => stat.stop())
    await setTimeout(1000)
    after ? await after() : null
    return process.exit(code)
  }

  const onError = async error => {
    console.log(c(['red'], `error:thread:${process.pid}`))
    console.error(error)
    await shutdown(1)
  }

  process.on('message', onPrimaryMessage)
  process.on('error', onError)
  ;['SIGINT', 'SIGTERM', 'disconnect']
    .forEach(signal => process.on(signal, () => shutdown(0)))


  runner.start(taskFn.bind(this, parameters))
}

export default thread
