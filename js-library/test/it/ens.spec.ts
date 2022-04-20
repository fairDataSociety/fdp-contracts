import { Wallet } from 'ethers'
import { ENS } from '../..'

describe('ENS service tests', () => {
  const ens = new ENS()
  const username = 'test_user'
  const privateKey = '0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd'
  let wallet: Wallet

  beforeAll(() => {
    wallet = new Wallet(privateKey, ens.provider)
    ens.connect(wallet)
  })

  test('Username should be available', async () => {
    const result = await ens.isUsernameAvailable(username)

    expect(result).toEqual(true)
  })

  test('Should register username', async () => {
    const address = await wallet.getAddress()

    await ens.registerUsername(username, address, wallet.publicKey)

    const owner = await ens.getUsernameOwner(username)

    expect(owner).toEqual(address)
  })
})
