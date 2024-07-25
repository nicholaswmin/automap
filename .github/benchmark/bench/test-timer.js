import { setImmediate } from 'timers/promises'
import { styleText as c } from 'node:util'
import { round } from '../../../test/util/index.js'
import { TimeoutTimer } from './timers.js'

class TestTimer {
  constructor({ durationSeconds }, cb = () => {}) {
    this.timer = new TimeoutTimer(async () => {
      console.log(c(['greenBright'], 'Test ended with status: success'))

      console.info(
        'target duration:',
        round(durationSeconds),
        'seconds.',
        'actual duration:',
        round(process.uptime()),
        'seconds.'
      )

      await this.stop()

      return cb()
    }, durationSeconds * 1000)
  }

  start() {
    this.timer.start()
  }

  async stop() {
    this.timer.stop()
    await setImmediate()
  }
}

export default TestTimer
