import { Wallet } from 'ethers'
import { initEns, randomWallet, topUpAddress } from '../utils'

describe('ENS service tests', () => {
  const ens = initEns()
  const username = 'test_user'
  const missingUsername = 'nouser'
  const privateKey = '0x2ba2638f4fa1deb5bd363e8e99347cd3018774c24d11e826e5d7ef21643827bf'
  let wallet: Wallet

  beforeAll(async () => {
    wallet = new Wallet(privateKey, ens.provider)
    ens.connect(wallet)

    await topUpAddress(ens.provider, wallet.address, '1')
  })

  test('Username should be available', async () => {
    const result = await ens.isUsernameAvailable(missingUsername)

    expect(result).toEqual(true)
  })

  test('Should register username and set public key', async () => {
    const address = await wallet.getAddress()

    await ens.registerUsername(ens.createRegisterUsernameRequest(username, address, wallet.publicKey))

    const owner = await ens.getUsernameOwner(username)

    expect(owner).toEqual(address)

    const publicKey = await ens.getPublicKey(username)

    expect(publicKey).toEqual(wallet.publicKey)
  })

  test('Should retrieve correct name by address', async () => {
    const address = await wallet.getAddress()

    const fetchedUsername = await ens.getUsernameByAddress(address)

    expect(fetchedUsername).toEqual(username)
  })

  test('Accessing nonexistent address should throw an error', async () => {
    let errorMessage = ''

    try {
      const username = await ens.getUsernameByAddress('0xa52847b29182B2DEE40F7915E94cdDc738437EE9')
    } catch (error) {
      errorMessage = String(error)
    }

    expect(errorMessage).toEqual('Error: Address is not available in reverse registrar.')
  })

  test('Register username with different wallet', async () => {
    const ens2 = initEns()
    let wallet2 = randomWallet()
    wallet2 = wallet2.connect(ens2.provider)
    ens2.connect(wallet2)
    const username2 = 'test_user_2'

    await topUpAddress(ens2.provider, wallet2.address)
    await ens2.registerUsername(
      ens.createRegisterUsernameRequest(username2, wallet2.address, wallet2.publicKey),
    )

    const owner = await ens.getUsernameOwner(username2)

    expect(owner).toEqual(wallet2.address)

    const publicKey = await ens.getPublicKey(username2)

    expect(publicKey).toEqual(wallet2.publicKey)
  })

  test('Accessing public key of unexisting username should throw error', async () => {
    expect(ens.getPublicKey(missingUsername)).rejects.toEqual(
      new Error('Public key is not set or is invalid'),
    )
  })
})
