import path from 'node:path'
import * as fs from 'node:fs/promises'

const dirname = import.meta.dirname

const replaceTokensInFile = async ({ 
  srcFolder, 
  filepath, 
  entrypath,
  fragments 
}) => {    
  for (const fragment of fragments) {
    const srcpath = path.join(dirname, `../${srcFolder}/${fragment.target}`)
    const contents = await fs.readFile(srcpath, 'utf8')
    const processed = contents.replaceAll('{{entryFile}}', entrypath)
    const existing = await fs.readFile(filepath, 'utf8')

    const n1 = existing.indexOf(fragment.startToken)
    const n2 = existing.indexOf(fragment.endToken, n1)
    const rm = existing.slice(0, n1) + existing.slice(n2)

    await fs.writeFile(
      filepath, 
      `${rm.slice(0, n1)}${fragment.startToken}\n${processed}${rm.slice(n1)}`
    )
  }
}

const createExample = async ({ 
  srcFolder, 
  targetFolder, 
  entrypath, 
  fragments 
}) => {
  try {
    await fs.rm(targetFolder, { recursive: true, force: true })
    await fs.mkdir(targetFolder)
    
    console.log('created:', targetFolder)
  
    for (const fragment of fragments) {
      const srcpath = path.join(dirname, `../${srcFolder}/${fragment.target}`)
      const contents = await fs.readFile(srcpath, 'utf8')
      const processed = contents.replaceAll('{{entryFile}}', entrypath).trim()

      await fs.writeFile(`${targetFolder}/${fragment.target}`, processed)
    }    
  } catch (err) {
    console.log('An error occured.', 'cleaning up ...')
    
    await fs.rm(targetFolder, { recursive: true, force: true })
    
    throw err 
  }
}

export { createExample, replaceTokensInFile }
