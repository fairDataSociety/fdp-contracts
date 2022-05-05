import { EnsUsername } from '../model/domain.type'
import { assert } from './assert'

export function isUsernameValid(username: unknown): username is EnsUsername {
  if (!username || typeof username !== 'string') return false
  const pattern = /^[a-z0-9_-]*$/
  const matches = username.match(pattern)
  const pattern2 = /^[A-Z]*$/
  const matches2 = username.match(pattern2)
  return (
    username.length < 83 && username.length > 3 && matches !== null && matches.length > 0 && matches2 === null
  )
}

export function assertUsername(username: EnsUsername) {
  assert(isUsernameValid(username), 'Username is not valid.')
}
