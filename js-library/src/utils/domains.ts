import { Username } from '../model/domain.type'
import { assert } from './assert'

export function isUsername(username: unknown): username is Username {
  if (!username || typeof username !== 'string') return false
  const pattern = /^[a-z0-9_-]*$/
  const matches = username.match(pattern)
  const pattern2 = /^[A-Z]*$/
  const matches2 = username.match(pattern2)
  return (
    username.length < 83 && username.length > 3 && matches !== null && matches.length > 0 && matches2 === null
  )
}

export function assertUsername(username: Username): asserts username is Username {
  assert(isUsername(username), 'Username is not valid.')
}
