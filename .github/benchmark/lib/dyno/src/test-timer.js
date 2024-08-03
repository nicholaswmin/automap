import { setTimeout } from 'timers/promises'
import { StatsTracker } from './stats/stats-tracker.js'

class TestTimer {
  constructor() {
    this.timer = null
    this.interval = null
    this.seconds = 60
    this.stats = new StatsTracker(['uptime'])
  }

  async start(seconds) {
    this.seconds = seconds || this.seconds

    this.interval = setInterval(() => {
      this.stats.uptime.tick()
      this.stats.publish()
    }, 1000)

    this.timer = await setTimeout(parseInt(this.seconds * 1000))
  }

  async stop() {
    clearTimeout(this.timer)
    clearInterval(this.interval)
    this.stats.stop()
  }
}

export default TestTimer
