import { setTimeout } from 'timers/promises'
import { RunnerStatsTracker } from './stats/stats-tracker.js'

class TestTimer {
  constructor() {
    this.timer = null
    this.interval = null
    this.seconds = 60
    this.stats = new RunnerStatsTracker(['uptime'])
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
