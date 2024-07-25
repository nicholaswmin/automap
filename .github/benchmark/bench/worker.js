import {
  WorkerStatsTracker,
  WorkerObservedStatsTracker
} from './stats/stats-tracker.js'
import { TaskRunner } from './task-runner.js'

const worker = async ({ taskFn, after = async () => { } }) => {
  const runner = new TaskRunner()
  const stats = {
    general: new WorkerStatsTracker(['task', 'memory', 'backlog']),
    functions: new WorkerObservedStatsTracker(['function'])
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
      return process.exit(0)

    if (message.type === 'task:execute') {
      runner.enqueue(message.task)

      return process.send({ type: 'ack' })
    }

    throw new Error(`Unknown type. Got: ${JSON.stringify(message)}`)
  }

  const shutdown = async exitCode => {
    await runner.stop()
    await after()

    return process.exit(exitCode)
  }

  const onError = async error => {
    console.error(error)
    await shutdown(1)
  }

  process.on('message', onPrimaryMessage)
  process.on('error', onError)
  ;['SIGINT', 'SIGTERM', 'disconnect']
    .forEach(signal => process.on(signal, () => shutdown(0)))

  runner.start(taskFn)
}

export default worker
