import { describe, expect, it } from 'vitest'
import { isMediaName, sniffImage } from './image'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

describe('sniffImage', () => {
  it('detects formats by magic bytes', () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpg')
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png')
    expect(sniffImage(bytes(...ascii('GIF89a')))).toBe('gif')
    expect(sniffImage(bytes(...ascii('GIF87a')))).toBe('gif')
    expect(sniffImage(bytes(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBP')))).toBe('webp')
  })
  it('rejects other content, including a fake extension', () => {
    expect(sniffImage(bytes(...ascii('<svg xmlns')))).toBeNull()
    expect(sniffImage(bytes(...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WAVE')))).toBeNull()
    expect(sniffImage(new Uint8Array([0xff, 0xd8]))).toBeNull()
  })
})

describe('isMediaName', () => {
  it('accepts only generated names', () => {
    expect(isMediaName('0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f.png')).toBe(true)
    expect(isMediaName('../secret.png')).toBe(false)
    expect(isMediaName('0b6c1c1e-9a2f-4d6e-8f4c-2a1b3c4d5e6f.svg')).toBe(false)
    expect(isMediaName('0B6C1C1E-9A2F-4D6E-8F4C-2A1B3C4D5E6F.png')).toBe(false)
  })
})
