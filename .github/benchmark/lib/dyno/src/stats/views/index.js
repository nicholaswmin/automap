import RowTable from './row-table.js'
import ThreadTable from './thread-table.js'
import TaskPlot from './task-plot.js'

export default (rows, fields, additionalRows) => {
  // @TODO this should be defined in the config
  return [
    new RowTable(fields.parameters, additionalRows),
    new RowTable(fields.runner, rows.runner),
    new ThreadTable(fields.threads, rows.threads),
    new TaskPlot(fields.threads, rows.threads)
  ]
}
