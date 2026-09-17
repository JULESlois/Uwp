import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const releaseTag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME

if (!releaseTag) throw new Error('Release tag is required via RELEASE_TAG or GITHUB_REF_NAME')
if (packageJson.name !== 'uwp_components') throw new Error(`Unexpected package name: ${packageJson.name}`)
if (packageJson.private !== true) throw new Error('Repository root must remain private to prevent accidental publication')

const expectedTag = `v${packageJson.version}`
if (releaseTag !== expectedTag) {
  throw new Error(`Release tag ${releaseTag} does not match package version ${packageJson.version}; expected ${expectedTag}`)
}

console.log(`Verified release ${releaseTag} for ${packageJson.name}@${packageJson.version}`)
