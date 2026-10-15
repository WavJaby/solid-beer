import { isServer } from 'solid-js/web'
import { describe, expect, it } from 'vitest'
import { baseComponents, beerCssComponents, compositeComponents, solidBeerComponents } from '../src'

// beercss.com documents 32 component categories (docs/*.md); the inventory must mirror that list one-to-one.
const BEERCSS_CATEGORY_COUNT = 32

describe('environment', () => {
  it('runs on client', () => {
    expect(typeof window).toBe('object')
    expect(isServer).toBe(false)
  })
})

describe('BeerCSS component inventory', () => {
  it('tracks every BeerCSS category exactly once with a status', () => {
    expect(beerCssComponents).toHaveLength(BEERCSS_CATEGORY_COUNT)
    expect(new Set(beerCssComponents.map(component => component.name)).size).toBe(BEERCSS_CATEGORY_COUNT)
    const implemented = beerCssComponents.filter(component => component.status === 'implemented')
    const planned = beerCssComponents.filter(component => component.status === 'planned')
    expect(implemented.length + planned.length).toBe(BEERCSS_CATEGORY_COUNT)
    expect(implemented.map(component => component.name)).toContain('Badges')
  })
})

describe('Solid component groups', () => {
  it('keeps base and composite component names distinct', () => {
    expect(baseComponents.every(component => component.category === 'base')).toBe(true)
    expect(compositeComponents.every(component => component.category === 'composite')).toBe(true)
    expect(new Set(solidBeerComponents.map(component => component.name)).size).toBe(solidBeerComponents.length)
  })
})
