import { describe, expect, it } from 'vitest'
import { decodeAccountTokens, mergeAccount, parseAccountTokens, serializeAccounts, type AccountToken } from './accounts'

const acc = (userId: string, token = `t-${userId}`): AccountToken => ({ token, userId, tokenVersion: 0 })

describe('multi-account cookie', () => {
  it('parses defensively', () => {
    expect(parseAccountTokens(undefined)).toEqual([])
    expect(parseAccountTokens('not json')).toEqual([])
    expect(parseAccountTokens('{"a":1}')).toEqual([])
    expect(parseAccountTokens('["a", 1, null, "b"]')).toEqual(['a', 'b'])
  })

  it('keeps one token per account, newest first, max 5', () => {
    let list: AccountToken[] = []
    for (const u of ['a', 'b', 'c']) list = mergeAccount(list, acc(u))
    list = mergeAccount(list, acc('a', 't-a2')) // đăng nhập lại a → thay token cũ, lên đầu
    expect(list.map((x) => x.token)).toEqual(['t-a2', 't-c', 't-b'])
    for (const u of ['d', 'e', 'f']) list = mergeAccount(list, acc(u))
    expect(list.map((x) => x.userId)).toEqual(['f', 'e', 'd', 'a', 'c'])
    expect(JSON.parse(serializeAccounts(list))).toHaveLength(5)
  })

  it('drops tokens that fail signature checks', async () => {
    const { signSession } = await import('./session')
    const good = await signSession('11111111-1111-1111-1111-111111111111', 3)
    const out = await decodeAccountTokens([good, 'forged.token.value', `${good}x`])
    expect(out).toEqual([{ token: good, userId: '11111111-1111-1111-1111-111111111111', tokenVersion: 3 }])
  })
})
