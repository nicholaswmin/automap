// Task file for testing calculation of the mean.
//
// - If this is run enough times we expect the mean to fall somewhere around
//   ~5ms because of the distribution.

import { thread } from '../../index.js'

thread(async parameters => {
  const delay = Math.round(Math.random() * 100)
  await new Promise(resolve => setTimeout(resolve, delay))
}, {
  before: () => {},
  after: () => { }
})
