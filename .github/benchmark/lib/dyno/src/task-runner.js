import { EventEmitter } from 'node:events'

class TaskRunner extends EventEmitter {
  constructor() {
    super()
    this.pid = process.pid.toString()
    this.backlog = []
    this.taskFn = null
    this.measure = null
    this.state = {
      started: false,
      stopped: false,
      running: false
    }
  }

  async enqueue(task) {
    if (this.state.stopped)
      return null

    if (!this.state.started)
      throw new Error('tracker has not started yet')

    if (this.state.running)
      return this.backlog.push(task)

    this.state.running = true

    performance.mark('t-0')

    try {
      await this.taskFn(task)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }

    if (this.state.stopped) {
      this.backlog = []

      return
    }

    performance.mark('t-1')

    this.measure = performance.measure('task-end', {
      detail: task.detail, start: 't-0', end: 't-1'
    })

    this.emit('task:run', this)

    this.state.running = false

    return this.backlog.length
      ? this.enqueue(this.backlog.pop())
      : true
  }

  start(taskFn) {
    if (this.state.started)
      throw new Error('Already running')

    if (this.state.stopped)
      throw new Error('Previously stopped')

    this.taskFn = taskFn
    this.state.started = new Date()

    return this
  }

  stop() {
    this.state.stopped = new Date()

    return this.removeAllListeners('task:run')
  }
}

export { TaskRunner }
