import RowTable from './row-table.js'
import ThreadTable from './thread-table.js'
import TaskPlot from './task-plot.js'

export default (rows, fields, additionalRows) => {
  return {
    parameters: new RowTable(fields.parameters, additionalRows),
    primary: new RowTable(fields.primary, rows.primary),
    tables: [ new ThreadTable(fields.threads, rows.threads) ],
    plots: [ new TaskPlot(fields.threads, rows.threads) ]
  }
}
