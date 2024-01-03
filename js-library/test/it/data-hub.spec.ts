import { Wallet, utils } from 'ethers'
import { Environments, SwarmLocation, getDataHubEnvironmentConfig } from '../../'
import { DataHub } from '../../src/services/data-hub'
import { toHash, topUpAddress } from '../utils'

describe('DataHub service tests', () => {
  let dataHub: DataHub
  const sellerUsername = 'testuser'
  const podAddress1 = '0x9BDc3DF70Db00Fdc745dA0FeAb9a70d153270244'
  const podAddress2 = '0x98d471aC5202ceD654d14612716f729EB24be7B8'
  const sellerPrivateKey = '0x10b71dbc950ef7c575cde502139effa331e15ae23cdf856229799b2cedbd135c'
  const buyerPrivateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1e'
  let wallet: Wallet

  beforeAll(async () => {
    dataHub = new DataHub(getDataHubEnvironmentConfig(Environments.LOCALHOST))
    wallet = new Wallet(sellerPrivateKey, dataHub.provider)
    dataHub.connect(wallet)
    await topUpAddress(dataHub.provider, wallet.address, '0.5')
    await topUpAddress(dataHub.provider, new Wallet(buyerPrivateKey).address, '0.2')
  })

  test('Should create subscriptions', async () => {
    const swarmLocation1 = toHash(10) as SwarmLocation
    const swarmLocation2 = toHash(11) as SwarmLocation
    const category = toHash(1)
    const price = utils.parseEther('0.1')
    const daysValid = 3
    await dataHub.createSubscription(
      sellerUsername,
      swarmLocation1,
      price,
      category,
      podAddress1,
      daysValid,
      utils.parseEther('0.01'),
    )

    await dataHub.createSubscription(
      sellerUsername,
      swarmLocation2,
      price,
      category,
      podAddress2,
      daysValid,
      utils.parseEther('0.01'),
    )

    const subscriptions = await dataHub.getUsersSubscriptions(wallet.address)

    expect(subscriptions.length).toEqual(2)
    expect(subscriptions[0].seller).toEqual(wallet.address)
    expect(subscriptions[0].swarmLocation).toEqual(swarmLocation1)
    expect(subscriptions[0].price).toEqual(price)
    expect(subscriptions[0].daysValid).toEqual(daysValid)
  })

  test('Buyer should be able to get subscription', async () => {
    const buyerDataHub = new DataHub(getDataHubEnvironmentConfig(Environments.LOCALHOST))
    const buyerWallet = new Wallet(buyerPrivateKey, dataHub.provider)
    buyerDataHub.connect(buyerWallet)

    const [subscription] = await buyerDataHub.getUsersSubscriptions(wallet.address)

    await buyerDataHub.requestSubscription(subscription.subHash, 'buyer', subscription.price)

    const requests = await buyerDataHub.getSubRequests(wallet.address)

    expect(requests.length).toEqual(1)

    await dataHub.sellSubscription(requests[0].requestHash, toHash(200))

    const subItems = await buyerDataHub.getAllSubItems(buyerWallet.address)

    expect(subItems.length).toEqual(1)
  })
})
