// - Adds DB rows in the hooks and in the task itself

import { task } from '../../../index.js'
import { insertDBRow } from '../../utils/sqlite.js'

task(async parameters => {
  insertDBRow(process.pid, parameters.RANDOM_ID, 'task')
}, {
  before: parameters => {
    return insertDBRow(process.pid, parameters.RANDOM_ID, 'task:before')
  },

  after: parameters => {
    return insertDBRow(process.pid, parameters.RANDOM_ID, 'task:after')
  }
})
