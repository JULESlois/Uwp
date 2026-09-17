import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('package architecture boundaries', () => {
  it('keeps the collections public entrypoint independent from the components barrel', () => {
    const entrypoint = source('./entrypoints/collections.ts')

    expect(entrypoint).not.toMatch(/from ['"]\.\.\/components['"]/)
    expect(entrypoint).toMatch(/ListItem.*from ['"]\.\.\/collection-model['"]/)
  })

  it('keeps the collection item model free of React and component dependencies', () => {
    const model = source('./collection-model.ts')

    expect(model).not.toMatch(/from ['"]react['"]/)
    expect(model).not.toMatch(/from ['"].*components['"]/)
    expect(model).toMatch(/export type ListItem/)
  })
})
