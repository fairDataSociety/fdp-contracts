import { Wallet } from 'ethers'
import { ENS } from '../..'

describe('ENS service tests', () => {
  const ens = new ENS()
  const username = 'test_user'
  const missingUsername = 'nouser'
  const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
  let wallet: Wallet

  beforeAll(() => {
    wallet = new Wallet(privateKey, ens.provider)
    ens.connect(wallet)
  })

  test('Username should be available', async () => {
    const result = await ens.isUsernameAvailable(missingUsername)

    expect(result).toEqual(true)
  })

  test('Should register username and set public key', async () => {
    const address = await wallet.getAddress()

    await ens.registerUsername(username, address, wallet.publicKey)

    const owner = await ens.getUsernameOwner(username)

    expect(owner).toEqual(address)

    const publicKey = await ens.getPublicKey(username)

    expect(publicKey).toEqual(wallet.publicKey)
  })

  test('Accessing public key of unexisting username should throw error', async () => {
    expect(ens.getPublicKey(missingUsername)).rejects.toEqual(
      new Error('Public key is not set or is invalid'),
    )
  })
})
