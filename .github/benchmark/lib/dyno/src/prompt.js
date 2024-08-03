import input from '@inquirer/input'
import confirm from './utils/confirm.js'

const types = {
  'string': String,
  'number': Number,
  'boolean': Boolean
}

const flatten = obj => Object.assign(
  {}, ...function _flatten(o) { 
    return [].concat(...Object.keys(o)
      .map(k => 
        typeof o[k] === 'object' && !Array.isArray(o[k]) ?
          _flatten(o[k]) : 
          ({[k]: o[k]})
      )
    );
  }(obj)
)

const validateTypes = (obj, types) => {
  for (const key of Object.keys(obj)) {
    const t = typeof obj[key]

    if (!types[t])
      throw new TypeError(
        `Expected: ${key} to be: ${Object.keys(types).join(' or ')}, got: ${t}`
      )
  }
}

export default async parameters => {
  validateTypes(flatten(parameters), types)

  for (const key of Object.keys(parameters.configurable || {})) {
    const value = parameters.configurable[key]

    const answer = await input({
      message: `Enter a value for: ${key}`,

      default: value,

      validate: answer => {
        switch (typeof value) {
          case 'number':
            return Number.isInteger(+answer) && +answer > 0
              ? true : `${key} must be a positive integer`

          case 'string':
            return typeof answer === 'string' && answer.length > 0
              ? true : `${key} must be a string with length: > 0`

          case 'boolean':
            return !['true', 'false', true, false].includes(answer) 
              ? true : `${key} must be either "true" or "false"`

          default:
            throw new TypeError(`${key} has an invalid type: ${typeof value}`)
        }
      }
    })

    parameters[key] = types[typeof value](answer)
  }
  
  const frozen = Object.freeze(flatten(parameters, 'configurable'))
  
  
  if (!['test'].includes(process.env.NODE_ENV))
    if (!process.argv.includes('--no-confirm')) {
      console.log('\n')
      console.log(frozen)
      
      if (!await confirm('are these parameters correct?'))
        process.exit(1)
    }


  console.clear()

  return frozen
}
