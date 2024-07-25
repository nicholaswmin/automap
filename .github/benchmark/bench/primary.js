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

  const foreman = new Foreman({ cluster: cluster, numWorkers })

  const firehose = new Firehose({ tasksPerSecond })

  const testTimer = new TestTimer({ durationSeconds }, () => exit(0))

  const exit = async (exitCode = 0) => {
    await firehose.stop()
    console.log(c(['yellow'], `firehose stopped ...`))

    await testTimer.stop()
    console.log(c(['yellow'], `test timer stopped ...`))

    await foreman.stop()
    console.log(c(['yellow'], `workers stopped ...`))

    console.log(c(['yellow'], 'Dont forget to deprovision any add-ons! Bye 👋'))
    process.exit(exitCode)
  }

  const observer = new StatsObserver({ fields, statsPerSecond })

  const onSIGINT = async () => {
    const text = 'User requested stop'
    const warn = 'Dont forget to deprovision added add-ons! Bye 👋'

    console.log(c(['yellow'], 'User requested stop ...'))

    await exit(0)
  }

  const start = async () => {
    process.once('SIGINT', onSIGINT)

    await foreman.start()

    firehose.start(foreman.workers)
    testTimer.start()
    observer.observe()
  }

  await start()
}

export default primary
