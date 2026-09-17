import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const target = resolve(process.cwd(), 'npm-package')
const allowedTopLevel = new Set(['README.md', 'package.json', 'dist-lib'])
const entries = await readdir(target)
const unexpected = entries.filter((entry) => !allowedTopLevel.has(entry))

if (unexpected.length > 0) {
  throw new Error(`Unexpected files in staged npm package: ${unexpected.join(', ')}`)
}

for (const required of allowedTopLevel) {
  if (!entries.includes(required)) throw new Error(`Missing staged npm package entry: ${required}`)
}

const packageJson = JSON.parse(await readFile(resolve(target, 'package.json'), 'utf8'))
const readme = await readFile(resolve(target, 'README.md'), 'utf8')

if (packageJson.name !== 'uwp_components') throw new Error(`Unexpected npm package name: ${packageJson.name}`)
if ('private' in packageJson) throw new Error('Published package metadata must not include the private flag')
if ('devDependencies' in packageJson) throw new Error('Published package metadata must not include devDependencies')
if ('scripts' in packageJson) throw new Error('Published package metadata must not include repository scripts')
if (!packageJson.exports?.['./controls'] || !packageJson.exports?.['./overlays']) {
  throw new Error('Published package is missing domain exports')
}
if (!readme.includes('## Install') || !readme.includes('## Quick start') || !readme.includes('## Import paths')) {
  throw new Error('npm README must remain usage-first')
}
if (/showcase|examples\/project-hub/i.test(readme)) {
  throw new Error('npm README must not contain Showcase/example documentation')
}

console.log('Verified clean npm staging package')
