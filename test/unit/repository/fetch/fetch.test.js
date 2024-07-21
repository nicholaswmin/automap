import test from 'node:test'
import ioredis from 'ioredis-mock'

import { Repository } from '../../../../src/repository.js'
import { Building } from '../../../util/model/index.js'

test('Repository', async t => {
  let repo, fetched

  await t.test('#fetch', async t => {
    t.beforeEach(() => {
      repo = new Repository(Building, new ioredis())
    })

    await t.test('no parameter is passed', async t => {
      await t.test('rejects with error', async () => {
        await t.assert.rejects(
          async () => {
            await repo.fetch()
          }
        )
      })
    })

    await t.test('passed "id" is an empty string', async t => {
      await t.test('rejects with error', async () => {
        await t.assert.rejects(
          async () => {
            await repo.fetch('')
          }
        )
      })
    })

    await t.test('passed "id" is a valid string', async t => {
      await t.test('resolves', async () => {
        await t.assert.doesNotReject(
          async () => {
            await repo.fetch('ciBr8Y')
          }
        )
      })
    })

    await t.test('passed "id" does not exist', async t => {
      await t.beforeEach(async () => {
        fetched = await repo.fetch('non-existent-id')
      })

      await t.test('resolves with null', async () => {
        t.assert.ok(fetched === null, 'result is null')
      })
    })

    t.todo('passed "id" exists', async t => {
      await t.beforeEach(async () => {
        await repo.save(new Building({ id: 'foo' }))

        fetched = await repo.fetch('foo')
      })

      await t.test('resolves with hydrated instance', async () => {
        // @TODO
        // throws `hashes.map is not a function`, maybe because `ioredis-mock`
        console.log(fetched)
      })
    })
  })
})
