// records an arbitrary value for i.e "task `cycle`" 
// so it appears in the collected measurements

import { run } from '../../../index.js'
import histogram from '../../../src/histogram/index.js'

run(async function task() {
  histogram('cycle').record(10)
})
