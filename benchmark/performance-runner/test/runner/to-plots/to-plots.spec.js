import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, result = null, rows = null, foo = null, bar = null

  await t.todo('#toPlots', async t => {
    // @TODO
  })
})
