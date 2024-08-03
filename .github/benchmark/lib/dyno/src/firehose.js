import { RunnerStatsTracker } from './stats/stats-tracker.js'

class Firehose {
  constructor() {
    this.stats = new RunnerStatsTracker(['sent', 'replies', 'memory'])
    this.tasksSecond = 1

    this.threads = []
    this.taskTimer = null
  }

  start({ threads, tasksSecond = 50 }) {
    this.threads = threads
    this.tasksSecond = tasksSecond > 0 ? tasksSecond : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${tasksSecond}`)
    })()

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
       Math.round(1000 / this.tasksSecond)
    )
  }

  stop() {
    clearInterval(this.taskTimer)
    this.stats.stop()
  }

  sendToRandom() {
    const interval = Math.round(1000 / this.tasksSecond)
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
