import { namehash } from 'ethers/lib/utils'

export function hashAddress(address: string): string {
  return namehash(address.toLowerCase().substring(2) + '.addr.reverse')
}
