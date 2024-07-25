import { styleText as c } from 'node:util'
import { StatsObserver } from './stats/stats-observer.js'

import Firehose from './firehose.js'
import Foreman from './foreman.js'
import TestTimer from './test-timer.js'

const primary = async ({
  cluster,
  fields,
  numWorkers,
  tasksPerSecond,
  durationSeconds,
  statsPerSecond,
  before = async () => {}
}) => {
  await before()
  const foreman = new Foreman(cluster, { numWorkers })
  const firehose = new Firehose({ tasksPerSecond })
  const testTimer = new TestTimer({ durationSeconds }, () => shutdown(0))
  const observer = new StatsObserver({ fields, statsPerSecond })

  const shutdown = async code => {
    console.log('\n')

    const timer = setTimeout(() => {
      console.log(c(['red'], 'graceful shutdown timed out. Force exiting ...'))
      return exit(1)
    }, 5 * 1000)

    console.log(c(['yellow'], 'shutting down ...'))

    observer.stop()
    console.log(c(['yellow'], 'stats observer stopped ...'))

    await firehose.stop()
    console.log(c(['yellow'], 'firehose stopped ...'))

    await testTimer.stop()
    console.log(c(['yellow'], 'test timer stopped ...'))

    await foreman.stop()
    console.log(c(['yellow'], 'threads gracefully shutdown ...'))

    console.log(c(['yellow'], 'Remember to deprovision any add-ons! Bye 👋'))

    clearTimeout(timer)

    return exit(code)
  }

  const exit = code => {
    console.log(c([code !== 0 ? 'red' : 'green'], `exited with code: ${code}`))

    process.exit(code)
  }

  const onClusterExit = (worker, code, signal) => {
    if (code === 0)
      return false

    console.log(
      c(['red'], `thread: ${worker.process.pid} exited with code: ${code}`)
    )

    return shutdown(code)
  }

  const onSIGTERM = () => shutdown(0)

  const onSIGINT = async () => {
    console.log('\n')
    console.log(c(['yellow'], 'user requested stop ...'))

    await shutdown(0)
  }

  const start = async () => {
    process.once('SIGTERM', onSIGTERM)
    process.once('SIGINT', onSIGINT)
    cluster.once('exit', onClusterExit)

    const workers = await foreman.start()

    firehose.start(workers)
    testTimer.start()
    observer.start()
  }

  await start()
}

export default primary
