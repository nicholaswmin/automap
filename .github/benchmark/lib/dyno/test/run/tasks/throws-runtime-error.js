// throws a runtime error on the 5th cycle
import { run } from '../../../index.js'

let count = 0

run(async function task() {
  if (++count >= 5)
    throw new Error('A simulated error occured')
})
