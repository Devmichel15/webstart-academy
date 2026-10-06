import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockSupabase } from './harness.js'
import { makeProfile } from './fakeSupabase.js'

const AUTH_UID = '11111111-1111-4111-8111-111111111111'

let adminService
let fake

beforeEach(async () => {
  vi.resetModules()
  fake = mockSupabase()
  adminService = await import('../services/adminService.js')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('admin current trail', () => {
  it('maps profiles.current_course to currentCourse', async () => {
    fake.db.profiles.push(makeProfile({ id: AUTH_UID, current_course: 'html' }))

    const users = await adminService.getAllUsers()

    expect(users[0].currentCourse).toBe('html')
  })
})
