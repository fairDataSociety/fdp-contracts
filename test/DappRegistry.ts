/* eslint-disable node/no-unsupported-features/es-syntax */
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DappRegistry, TestToken } from '../typechain'

describe('dapp registry', () => {
  let dappRegistry: DappRegistry
  let testToken: TestToken
  const name = 'Swarm Dapp Registry'
  const ens = '0x54247f84A6c8857d3214A298925A099aa0eDE08A'
  const node = '0x787192fc5378cc32aa956ddfdedbf26b24e8d78e40109add0eea2c1a012c3dec' // alice.eth
  const amount = ethers.utils.parseEther('1')
  const record = {
    node,
    owner: '0xC47c055b3EBfA044851Ac87B8240f77DF90fdcB8',
    description: 'NFT Sample Dapp',
    version: 1,
    indexType: 1,
    dataFormat: ethers.utils.formatBytes32String('beeson'),
    blobRef: '0xfd79d5e0ebd8407e422f53ce1d7c4c41ebf403be55143900f8d1490560294780',
    timestamp: new Date().getTime(),
  }
  before(async () => {
    const TestToken = await ethers.getContractFactory('TestToken')
    testToken = await TestToken.deploy()
    await testToken.deployed()

    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    dappRegistry = await DappRegistry.deploy(name, testToken.address, ens, amount.toString())
    await dappRegistry.deployed()
  })

  it('should get registry details', async () => {
    const details = await dappRegistry.getRegistryDetails()
    expect(name).equal(details[0])
    expect(testToken.address).equal(details[1])
    expect(amount).equal(details[2])
  })

  describe('when creating a new record', () => {
    it('should add dapp record', async () => {
      const staked = ethers.utils.parseEther('1')
      await testToken.approve(dappRegistry.address, staked)
      await dappRegistry.add(node, staked, record)
      const query = dappRegistry.filters.DappRecordAdded(null, null, null)
      const logs = await dappRegistry.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal(node)
    })

    it('should fetch dapp', async () => {
      const dapp = await dappRegistry.get(node)
      expect(dapp.node).equal(node)
      expect(dapp.timestamp).equal(record.timestamp)
      expect(dapp.blobRef).equal(record.blobRef)
      expect(dapp.dataFormat).equal(record.dataFormat)
      expect(dapp.description).equal(record.description)
      expect(dapp.owner).equal(record.owner)
    })

    it('should get list of dapps', async () => {
      const details = await dappRegistry.getRegistryDetails()
      expect(name).equal(details[0])

      expect(amount).equal(details[2])
    })
  })
})
