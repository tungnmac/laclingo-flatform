// Gọi API bên ngoài cho job đồng bộ: giới hạn số request / phút + thử lại khi lỗi mạng / 429 / 5xx.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Giãn cách tối thiểu giữa các request (1 nguồn = 1 Throttle, dùng chung cho cả job) */
export class Throttle {
  private next = 0
  constructor(private readonly perMinute: number) {}
  async wait(): Promise<void> {
    const gap = 60_000 / Math.max(1, this.perMinute)
    const now = Date.now()
    const at = Math.max(now, this.next)
    this.next = at + gap
    if (at > now) await sleep(at - now)
  }
}

export class SourceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
  }
}

const RETRIES = 3

/** fetch JSON qua throttle; 429 / 5xx / lỗi mạng → chờ (Retry-After hoặc lùi dần) rồi thử lại, tối đa 3 lần */
export async function fetchJson(throttle: Throttle, url: string, init: RequestInit = {}, label = url): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    await throttle.wait()
    let res: Response
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000), cache: 'no-store' })
    } catch (err) {
      if (attempt >= RETRIES) throw new SourceError(`${label}: ${(err as Error).message}`)
      await sleep(2_000 * 2 ** attempt)
      continue
    }
    if (res.ok) return res.json()
    await res.body?.cancel() // trả kết nối về pool
    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt >= RETRIES) throw new SourceError(`${label}: HTTP ${res.status}`, res.status)
    const retryAfter = Number(res.headers.get('retry-after'))
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 120) * 1000 : 5_000 * 2 ** attempt)
  }
}
