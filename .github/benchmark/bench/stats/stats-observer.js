import cluster from 'node:cluster'
import { localbus } from './local-bus.js'
import { Timer } from '../timers.js'

class StatsObserver {
  constructor({ fields = null, statsPerSecond } = {}) {
    this.bufferSize = 100
    this.maxWorkerRows = 5
    this.interval = Math.round(1000 / statsPerSecond)
    this.timer = new Timer(this.render.bind(this), this.interval)
    this.fields = fields || { primary: [], workers: [] }
    this.rows = { primary: {}, workers: {} }

    cluster.on('online', worker => {
      const pid = worker.process.pid
      worker.on('message', ({ type, row }) => {
        if (type !== 'stats:row:update')
          return

        Object.keys(row).forEach(key => {
          this.rows.workers[pid] = this.rows.workers[pid] || {}
          this.rows.workers[pid][key] = this.rows.workers[pid][key] || []
          this.rows.workers[pid][key].push(row[key])

          this.rows.workers[pid][key].length >= this.bufferSize
            ? this.rows.workers[pid][key].shift()
            : null
        })
      })
    })

    localbus.on('stats:row:update', row => {
      Object.keys(row).forEach(key => {
        this.rows.primary[key] = this.rows.primary[key] || []
        this.rows.primary[key].push(row[key])

        this.rows.primary[key].length >= this.bufferSize
          ? this.rows.primary[key].shift()
          : null
      })
    })
  }

  observe() {
    this.timer.start()
  }

  disconnect() {
    this.timer.stop()
    this.rows.primary = []
    this.rows.workers = []
  }

  render() {
    if (!Object.keys(this.rows.primary).length)
      return

    console.clear()

    console.log('\n')
    Object.keys(this.fields.general)
      .forEach(key => {
        console.log('\n')
        console.log(key, '\n')
        console.table([this.fields.general[key].reduce((acc, field) => ({
          ...acc,
          [field[1]]: field[0]
        }), {})])
      })

    console.log('\n')
    console.log('Primary stats', '\n')
    if (Object.keys(this.rows.primary).length) {
      console.table([
        this.fields.primary.reduce((acc, field) => {
          const split = field[0].split('.')
          const mapped = field[2]
            ? field[2](this.rows.primary[split[0]].at(-1)[split[1]])
            : this.rows.primary[split[0]].at(-1)[split[1]]
          return {
            ...acc,
            [field[1]]: mapped
          }
        }, {})
      ])
    }

    if (Object.keys(this.rows.workers).length) {
      Object.keys(this.fields.workers).forEach(key => {
        console.log('\n')
        console.log(key, '\n')

        const workers = Object.keys(this.rows.workers)
        const start = workers.length - this.maxWorkerRows
        const end = workers.length

        console.table(workers.slice(start, end).map(pid => {
          return {
            worker: pid,
            ...this.fields.workers[key].reduce((acc, field) => {
              const split = field[0].split('.')
              const rows = this.rows.workers[pid][split[0]]
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
        }))
      })
    }
  }
}

export { StatsObserver }
