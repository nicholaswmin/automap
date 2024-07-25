class Timer {
  constructor(cb, duration) {
    this.timer = null
    this.cb = typeof cb === 'function' ? cb : (() => {
      throw new RangeError(`Must be a function. Got: ${typeof cb}`)
    })()
    this.duration = typeof duration === 'number' && duration > 0
      ? duration
      : (() => {
        throw new RangeError(`"duration" must be an int > 0. Got: ${duration}`)
      })()
  }

  start() {
    this.timer = setInterval(this.cb, this.duration)
  }

  stop() {
    if (!this.timer)
      throw new Error('Cannot stop a timer that did not start')

    clearTimeout(this.timer)
    clearInterval(this.timer)
    clearImmediate(this.timer)
  }
}

class TimeoutTimer extends Timer {
  constructor(...args) {
    super(...args)
  }

  start() {
    this.timer = setTimeout(this.cb, this.duration)
  }
}

export { Timer, TimeoutTimer }
