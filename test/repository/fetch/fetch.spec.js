import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis-mock'

import { Repository } from '../../../src/repository.js'
import { Chatroom } from '../../model/index.js'

test('Repository', async t => {
  let repo, fetched

  await t.test('#fetch', async t => {
    await t.beforeEach(() => {
      repo = new Repository(Chatroom, new ioredis())
    })

    await t.test('no parameter object is passed', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(
          async () => {
            await repo.fetch({ foo: 'bar' })
          }
        )
      })
    })

    await t.test('no "id" is passed in parameter object', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(
          async () => {
            await repo.fetch({ foo: 'bar' })
          }
        )
      })
    })

    await t.test('passed "id" is an empty string', async t => {
      await t.test('rejects with error', async () => {
        await assert.rejects(
          async () => {
            await repo.fetch({ id: '' })
          }
        )
      })
    })

    await t.test('passed "id" is a valid string', async t => {
      await t.test('resolves', async () => {
        await assert.doesNotReject(
          async () => {
            await repo.fetch({ id: 'ciBr8Y' })
          }
        )
      })
    })

    await t.test('passed "id" does not exist', async t => {
      await t.beforeEach(async () => {
        fetched = await repo.fetch({ id: 'non-existent-id' })
      })

      await t.test('resolves with null', async () => {
        assert.ok(fetched === null, 'result is null')
      })
    })

    await t.todo('passed "id" exists', async t => {
      await t.beforeEach(async () => {
        await repo.save(new Chatroom({ id: 'foo' }))

        fetched = await repo.fetch({ id: 'foo' })
      })

      await t.test('resolves with hydrated instance', async () => {
        // @TODO
        // throws `hashes.map is not a function`, maybe because `ioredis-mock`
        console.log(fetched)
      })
    })
  })
})
