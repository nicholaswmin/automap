import {
  WorkerStatsTracker,
  WorkerObservedStatsTracker
} from './stats/stats-tracker.js'
import { TaskRunner } from './task-runner.js'

const worker = async ({ taskFn, after = () => { } }) => {
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

  process.on('SIGTERM', () =>
    runner.stop().then(() =>
      after()).then(() =>
        process.exit(0)))

  runner.start(taskFn)

  process.on('message', message => {
    if (message.type !== 'task:execute')
      return

    runner.enqueue(message.task)
    process.send({ type: 'ack' })
  })

  process.on('error', console.error.bind(console))
}

export default worker
