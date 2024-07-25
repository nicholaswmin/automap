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

  const testTimer = new TestTimer({ durationSeconds }, () => shutdown(0))

  const observer = new StatsObserver({ fields, statsPerSecond })

  const shutdown = async (code = 0) => {
    console.log('\n')

    console.log(c(['yellow'], `shutting down ...`))

    observer.stop()
    console.log(c(['yellow'], `stats observer stopped ...`))

    await firehose.stop()
    console.log(c(['yellow'], `firehose stopped ...`))

    await testTimer.stop()
    console.log(c(['yellow'], `test timer stopped ...`))

    await foreman.stop()
    console.log(c(['yellow'], `workers gracefully shutdown ...`))

    console.log(c(['yellow'], 'Remember to deprovision all add-ons! Bye 👋'))
    process.exit(code)
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

    await foreman.start()

    firehose.start(foreman.workers)
    testTimer.start()
    observer.start()
  }

  await start()
}

export default primary
