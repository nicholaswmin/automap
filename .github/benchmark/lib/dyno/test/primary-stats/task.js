// The task file for the tests
//
// - Each task simply adds a row to an SQLite3 DB


import { thread } from '../../index.js'
import { insertDBRow } from '../utils/sqlite.js'

thread(async parameters => {
  insertDBRow(process.pid, parameters.RANDOM_ID, Math.random())
}, {
  before: () => {},
  after: () => { }
})
