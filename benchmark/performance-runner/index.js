import { styleText as style } from 'node:util'
import { Table, printTable } from 'console-table-printer'

import { utils } from '../../index.js'
import performanceEntryViews from './performance-entry-views.js'

class PerformanceRunner {
  constructor(title = 'Performance Runner') {
    this.title = title
    this.entries = []
    this.observer = new PerformanceObserver(items => {
      this.entries.push(
        items.getEntries().flat().map(entry => entry.toJSON())
      )
    })

    this.observer.observe({
      entryTypes: PerformanceObserver.supportedEntryTypes
    })
  }

  async run(tasks) {
    for (let task of tasks) {
      performance.mark('memoryUsage', {
        detail: { value: utils.toMB(process.memoryUsage().heapUsed) + ' MB' }
      })

      for (let i = 0; i < task.times; i++) {
        await performance.timerify(task.fn)(task.name, i)
      }
    }
  }

  displayResults() {
    this.table = new Table({
      title: this.title,
      columns: [
        { name: 'type', alignment: 'right' },
        { name: 'name', alignment: 'right' },
        { name: 'value', alignment: 'left' }
      ]
    })

    this.laststep = null

    this.entries.flat().forEach(entry => {
      const step = ['function'].includes(entry.entryType) ?
        entry.detail.find(value => typeof value === 'string') : null

      if (step && this.laststep !== step) {
        this.laststep = step

        return this.table.addRows([
          {
            type:  '---------',
            name:  '---------------',
            value: '--------',
          },
          {
            type: style(['magenta'], 'step'),
            name: style(['magenta'], step),
            value: ''
          }
        ])
      }

      const key = ['fn'].includes(entry.name) ? entry.name : entry.entryType

      return this.table.addRow(performanceEntryViews[key](this, entry))
    })

    this.table.printTable()
  }
}

export { PerformanceRunner }
