import PrimaryTable from './primary-table.js'
import TaskTable from './task-table.js'
import TaskPlot from './task-plot.js'

export default (rows, fields) => {
  return {
    primary: new PrimaryTable(fields.primary, rows.primary),
    tables: [
      new TaskTable(fields.threads, rows.threads)
    ],
    plots: [
      new TaskPlot(fields.threads.measures, rows.threads)
    ]
  }
}
