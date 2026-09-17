import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const target = resolve(root, 'npm-package')
const sourcePackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(resolve(root, 'dist-lib'), resolve(target, 'dist-lib'), { recursive: true })
await cp(resolve(root, 'npm/README.md'), resolve(target, 'README.md'))

const publishedPackage = {
  name: 'uwp_components',
  version: sourcePackage.version,
  description: sourcePackage.description,
  type: sourcePackage.type,
  main: sourcePackage.main,
  module: sourcePackage.module,
  types: sourcePackage.types,
  exports: sourcePackage.exports,
  sideEffects: sourcePackage.sideEffects,
  repository: sourcePackage.repository,
  homepage: sourcePackage.homepage,
  bugs: sourcePackage.bugs,
  keywords: sourcePackage.keywords,
  publishConfig: sourcePackage.publishConfig,
  peerDependencies: sourcePackage.peerDependencies,
}

await writeFile(resolve(target, 'package.json'), `${JSON.stringify(publishedPackage, null, 2)}\n`)

console.log(`Prepared npm package at ${target}`)
console.log(`Package: ${publishedPackage.name}@${publishedPackage.version}`)
