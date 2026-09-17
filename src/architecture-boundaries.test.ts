import { describe, expect, it } from 'vitest'

const modules = import.meta.glob('./{entrypoints/collections.ts,collection-model.ts,collections.tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const source = (path: string) => {
  const content = modules[path]
  if (content === undefined) throw new Error(`Missing architecture fixture: ${path}`)
  return content
}

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

  it('keeps collection implementations independent from the components barrel', () => {
    const implementation = source('./collections.tsx')

    expect(implementation).not.toMatch(/from ['"]\.\/components['"]/)
    expect(implementation).toMatch(/ListItem.*from ['"]\.\/collection-model['"]/)
    expect(implementation).toMatch(/RadioButton.*from ['"]\.\/selectors['"]/)
  })
})
