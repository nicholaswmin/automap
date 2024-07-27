import input from '@inquirer/input'

export default async parameters => {
  for (const key of Object.keys(parameters)) {
    if (parameters[key].configurable) {
      const answer = await input({
        message: `Enter ${key}:`,
        default: parameters[key].value,
        validate: answer => {
          switch (parameters[key].type) {
            case Number:
              return !Number.isInteger(+answer) || +answer <= 0
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

      parameters[key] = parameters[key].type
        ? parameters[key].type(answer)
        : answer
    } else {
      parameters[key] = parameters[key].type
        ? parameters[key].type(parameters[key].value)
        : parameters[key].value || parameters[key]
    }
  }

  return Object.freeze(parameters)
}
