import { setImmediate } from 'timers/promises'
import { styleText as c } from 'node:util'
import { TimeoutTimer } from './timers.js'

const round = num => Math.round((num + Number.EPSILON) * 100) / 100

class TestTimer {
  constructor({ durationSeconds }, cb = () => {}) {
    this.timer = new TimeoutTimer(async () => {
      console.log(c(['greenBright'], 'Test timer elapsed'))
      console.log(c(['greenBright'], 'Test ended with status: success'))
      console.info('target:', round(durationSeconds), 'seconds.')
      console.info('elapsed:', round(process.uptime()), 'seconds.')

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
