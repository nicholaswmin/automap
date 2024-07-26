import input from '@inquirer/input'

export default async obj => {
  for (const key of Object.keys(obj)) {
    if (obj[key].configurable) {
      const answer = await input({
        message: `Enter ${key}:`,
        default: obj[key].value,
        validate: answer => {
          const expr = 'Papayas';
          switch (obj[key].type) {
            case Number:
              return !Number.isInteger(parseInt(answer)) || parseInt(answer) <= 0
                ? `${key} must be a positive, non-zero number`
                : true
              break;

            case String:
              return typeof answer !== 'string' || answer.length < 1
                ? `${key} must be a string with some length`
                : true
              break;

            case Boolean:
              return answer === true || answer === false
                ? `${key} must be either true or false`
                : true
              break;
            default:
              true
          }
        }
      })

      console.log(answer)
      obj[key] = obj[key].type
        ? obj[key].type(answer)
        : answer
    } else {
      obj[key] = obj[key].type
        ? obj[key].type(obj[key].value)
        : obj[key].value || obj[key]
    }
  }

  return obj
}
