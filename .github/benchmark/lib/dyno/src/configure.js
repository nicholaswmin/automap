import input from '@inquirer/input'

export default async obj => {
  for (const key of Object.keys(obj)) {
    if (obj[key].configurable) {
      const answer = await input({
        message: `Enter ${key}:`,
        default: obj[key].value,
        validate: answer => {
          const number = parseInt(answer)
          return !Number.isInteger(parseInt(number)) || parseInt(number) <= 0
            ? `${key} must be a positive, non-zero number`
            : true
        }
      })

      obj[key] = parseInt(answer)
    } else {
      obj[key] = parseInt(obj[key].value)
    }
  }

  return obj
}
