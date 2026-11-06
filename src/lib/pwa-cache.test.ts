import { expect, it } from 'vitest'
// @ts-expect-error The service-worker module is intentionally served from public/.
import { isCacheableAppRequest } from '../../public/cache-policy.js'

it('caches only PSTL static resources and never Supabase API responses', () => {
  const origin = 'https://pstl.vercel.app'
  expect(isCacheableAppRequest('https://pstl.vercel.app/assets/index.js', origin)).toBe(true)
  expect(isCacheableAppRequest('https://pstl.vercel.app/manifest.webmanifest', origin)).toBe(true)
  expect(isCacheableAppRequest('https://xvyxwhodvhyqkbxjfpxh.supabase.co/rest/v1/workout_sessions', origin)).toBe(false)
})
