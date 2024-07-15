import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis-mock'

import { Repository } from '../../../../src/repository.js'
import { Building, Mail } from '../../../util/model/index.js'

test('repository', async t => {
  let repo

  await t.test('#save', async t => {
    t.beforeEach(() => {
      repo = new Repository(Building, new ioredis())
    })

    await t.test('no object is passed as parameter', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(async () => repo.save())
      })
    })

    await t.test('passed object is not an object', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(async () => repo.save('not-an-object'))
      })
    })

    await t.test('passed object is not a type of specified class', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(async () => repo.save(new Mail({ id: 'foo' })))
      })
    })

    await t.test('passed object does not have an id', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(
          async () => repo.save({ ...new Building(), id: undefined })
        )
      })
    })

    await t.test('passed object has empty string as an id', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(
          async () => repo.save({ ...new Building(), id: '' })
        )
      })
    })

    await t.test('passed object has a valid & unique id', async t => {
      let response

      t.beforeEach(async () => {
        response = await repo.save(new Building({ id: 'foo' }))
      })

      await t.test('resolves with a value', async () => {
        await assert.doesNotReject(async () => repo.save(new Building()))
      })

      await t.test('value is "true"', () => {
        assert.ok(response === true, 'response is true')
      })
    })
  })
})
