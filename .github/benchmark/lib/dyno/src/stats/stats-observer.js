import localbus from './local-bus.js'
import { Timer } from '../timers.js'

class StatsObserver {
  constructor({ fields = null, extraFields } = {}) {
    this.bufferSize = 100
    this.statsPerSecond = 5
    this.maxThreadRows = 5
    this.interval = Math.round(1000 / this.statsPerSecond)
    this.timer = null
    this.extraFields = extraFields
    this.fields = fields || { general: {}, primary: [], threads: {} }
    this.rows = { primary: {}, threads: {} }
  }

  start(threads) {
    if (this.timer)
      throw new Error('already started')

    localbus.on('stats:row:update', row => {
      Object.keys(row).forEach(key => {
        this.rows.primary[key] = this.rows.primary[key] || []
        this.rows.primary[key].push(row[key])

        this.rows.primary[key].length >= this.bufferSize
          ? this.rows.primary[key].shift()
          : null
      })
    })

    Object.values(threads).forEach(thread => {
      const pid = thread.pid

      thread.on('message', ({ type, row }) => {
        if (type !== 'stats:row:update')
          return

        Object.keys(row).forEach(key => {
          this.rows.threads[pid] = this.rows.threads[pid] || {}
          this.rows.threads[pid][key] = this.rows.threads[pid][key] || []
          this.rows.threads[pid][key].push(row[key])

          this.rows.threads[pid][key].length >= this.bufferSize
            ? this.rows.threads[pid][key].shift()
            : null
        })
      })
    })

    this.timer = setInterval(this.render.bind(this), this.interval)
  }

  stop() {
    localbus.removeAllListeners('stats:row:update')
    clearInterval(this.timer)
  }

  render() {
    if (process.env.NODE_ENV === 'test')
      return

    console.log('\n')
    Object.keys(this.extraFields).forEach(key => {
      console.log(key, '\n')
      console.table([this.extraFields[key]])
    })

    console.log('\n')
    console.log('primary stats', '\n')
    if (Object.keys(this.rows.primary).length) {
      console.table([
        this.fields.primary.reduce((acc, field) => {
          const split = field[0].split('.')
          const mapped = field[2]
            ? this.rows.primary[split[0]]
              ? field[2](this.rows.primary[split[0]] .at(-1)[split[1]])
              : 'no data'
            : this.rows.primary[split[0]]
              ? this.rows.primary[split[0]].at(-1)[split[1]]
              : 'no data'

          return {
            ...acc,
            [field[1]]: mapped
          }
        }, {})
      ])
    }

    if (Object.keys(this.rows.threads).length) {
      Object.keys(this.fields.threads).forEach(key => {
        const sortby = this.fields.threads[key].sortby || 'thread'
        const threads = Object.keys(this.rows.threads)
        const start = threads.length - this.maxThreadRows
        const end = threads.length

        console.log('\n')
        console.log(`${key}, sorted by: "${sortby}"`, '\n')

        console.table(threads.slice(start, end).map(pid => {
          return {
            thread: pid,
            ...this.fields.threads[key].fields.reduce((acc, field) => {
              const split = field[0].split('.')
              const rows = this.rows.threads[pid][split[0]]
              const mapped = rows
                ? field[2]
                  ? field[2](rows.at(-1)[split[1]])
                  : rows.at(-1)[split[1]]
                : 'no data'

              return {
                ...acc,
                [field[1]]: mapped
              }
            }, {})
          }
        }).sort((a, b) => +b[sortby] - +a[sortby]))
      })
    }
  }

  getRows() {
    return this.rows
  }
}

export default StatsObserver
