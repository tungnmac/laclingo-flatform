import { describe, expect, it } from 'vitest'
import { nextReferenceParams } from './reference-params'

describe('nextReferenceParams', () => {
  it('drops the old tab filters when switching back to resources', () => {
    const next = nextReferenceParams(new URLSearchParams('tab=investors&q=buffett&country=US'), { tab: '' })
    expect(next.toString()).toBe('')
  })
  it('drops resource filters when switching to investors', () => {
    expect(nextReferenceParams(new URLSearchParams('q=cfa&type=program'), { tab: 'investors' }).toString()).toBe('tab=investors')
  })
  it('keeps other filters when only q changes', () => {
    expect(nextReferenceParams(new URLSearchParams('tab=investors&style=macro'), { q: 'soros' }).toString()).toBe('tab=investors&style=macro&q=soros')
    expect(nextReferenceParams(new URLSearchParams('q=x&type=youtube'), { q: '' }).toString()).toBe('type=youtube')
  })
})
