import input from '@inquirer/input'

const confirm = async (message = '') => {
  console.log('\n')

  const expect = ['y', 'yes']
  const answer = await input({ 
    message: `${message} type (${expect.join(' or ')}):`.trim()
  }).then(answer => answer.trim().toLowerCase())
  
  console.log('answered:', answer || 'no answer')
  
  return expect.includes(answer)
}

export default confirm
