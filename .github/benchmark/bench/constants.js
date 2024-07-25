import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import input from '@inquirer/input'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const set = async constants => {
  for (const key of Object.keys(constants.public)) {
    const answer = await input({
      message: `Enter ${key}:`,
      default: constants.public[key],
      validate: val => {
        return isNaN(val) || val <= 0
          ? `${key} must be a positive, non-zero number`
          : true
      }
    })

    constants.public[key] = Number(answer)
  }

  await writeFile(
    join(__dirname, 'constants.json'),
    JSON.stringify(constants),
    'utf-8'
  )

  return await load()
}

const load = async () => {
  const json = await readFile(join(__dirname, 'constants.json'), 'utf-8')

  return json ? JSON.parse(json) : null
}

export { set, load }
