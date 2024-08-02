import test from 'node:test'

import { Plot } from '../../index.js'

test('View: Plot', async t => {
  let plot

  t.beforeEach(async () => {
    plot = new Plot('foo')
  })

  await t.test('instantiates', t => {
    t.assert.ok(plot)
  })
  
  t.todo('#plot', () => {
    // @TODO
  })
  
  t.todo('#toString', () => {
    // @TODO
  })
})
