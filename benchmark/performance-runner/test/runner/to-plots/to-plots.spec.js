import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, result = null, rows = null, foo = null, bar = null

  await t.test('#toPlots', async t => {
    await t.test('does not throw', async t => {
      runner = new PerformanceRunner()

      assert.doesNotThrow(t => runner.toPlots())
    })

    await t.todo('draws a plot', async t => {
      // @TODO
    })
  })
})
