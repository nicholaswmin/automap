import { PrimaryStatsTracker } from './stats/stats-tracker.js'

class Firehose {
  constructor({ tasksPerSecond }) {
    this.stats = new PrimaryStatsTracker(['sent', 'replies', 'memory'])
    this.tasksPerSecond = tasksPerSecond > 0 ? tasksPerSecond : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${tasksPerSecond}`)
    })()

    this.threads = []
    this.taskTimer = null
  }

  start(threads) {
    this.threads = threads

    Object.values(threads).forEach(thread => {
      thread.on('message', message => {
        if (message.type === 'ack') {
          this.stats.replies.tick()
          this.stats.memory.record(process.memoryUsage().heapUsed)
          this.stats.publish()
        }
      })
    })

    this.taskTimer = setInterval(
      this.sendToRandom.bind(this),
       Math.round(1000 / this.tasksPerSecond)
    )
  }

  stop() {
    clearInterval(this.taskTimer)
    this.stats.stop()
  }

  sendToRandom() {
    const interval = Math.round(1000 / this.tasksPerSecond)
    const cycles = interval < 1 ? 1 / interval : 1

    for (let i = 0; i < cycles; i++) {
      const threads = Object.values(this.threads)
      const random = threads[Math.floor(Math.random() * threads.length)]

      random && random.connected ? random.send({
        type: 'task:execute',
        task: this.stats.sent.count + 1
      }) : null

      this.stats.sent.tick()
    }
  }
}

export default Firehose
