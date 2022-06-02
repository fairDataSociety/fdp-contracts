/* eslint-disable node/no-unsupported-features/es-syntax */
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DappRegistry, ENSRegistry, SubdomainRegistrar, TestToken } from '../typechain'

describe('dapp registry', () => {
  let dappRegistry: DappRegistry
  let testToken: TestToken
  let ens: ENSRegistry
  let subdomainRegistry: SubdomainRegistrar
  const name = 'Swarm Dapp Registry'
  const amount = ethers.utils.parseEther('1')
  const record = {
    node: 'placeholder',
    owner: '0xC47c055b3EBfA044851Ac87B8240f77DF90fdcB8',
    description: 'NFT Sample Dapp',
    version: 1,
    indexType: 1,
    dataFormat: ethers.utils.formatBytes32String('beeson'),
    blobRef: '0xfd79d5e0ebd8407e422f53ce1d7c4c41ebf403be55143900f8d1490560294780',
    timestamp: new Date().getTime(),
  }
  before(async () => {
    const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
    ens = await ENSRegistry.deploy()
    await ens.deployed()

    const SubdomainRegistrar = await ethers.getContractFactory('SubdomainRegistrar')
    subdomainRegistry = await SubdomainRegistrar.deploy(ens.address, ethers.utils.formatBytes32String('fds'))
    await subdomainRegistry.deployed()

    const TestToken = await ethers.getContractFactory('TestToken')
    testToken = await TestToken.deploy()
    await testToken.deployed()

    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    dappRegistry = await DappRegistry.deploy(name, testToken.address, ens.address, amount.toString())
    await dappRegistry.deployed()
  })

  it('should get registry details', async () => {
    const details = await dappRegistry.getRegistryDetails()
    expect(name).equal(details[0])
    expect(testToken.address).equal(details[1])
    expect(amount).equal(details[2])
  })

  describe('when creating a new record', () => {
    beforeEach(async () => {
      const [owner] = await ethers.getSigners()
      await subdomainRegistry.register(ethers.utils.formatBytes32String('dapp.registry.fds'), owner.address)
      const query = ens.filters.NewOwner(null, null, null)
      const logs = await ens.queryFilter(query)
      const log = logs[0].args
      expect(log[1]).equal('dapp.registry.fds')
      expect(log[2]).equal(owner)
    })

    it('should add dapp record', async () => {
      let query = ens.filters.NewOwner(null, null, null)
      let logs = await ens.queryFilter(query)
      const node = logs[0].args[0]
      record.node = node

      const staked = ethers.utils.parseEther('1')
      await testToken.approve(dappRegistry.address, staked)
      await dappRegistry.add(node, staked, record)
      query = dappRegistry.filters.DappRecordAdded(null, null, null)
      logs = await dappRegistry.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal(node)
    })

    it('should fetch dapp', async () => {
      const query = ens.filters.NewOwner(null, null, null)
      const logs = await ens.queryFilter(query)
      const node = logs[0].args[0]

      const dapp = await dappRegistry.get(node)
      expect(dapp.node).equal(node)
      expect(dapp.timestamp).equal(record.timestamp)
      expect(dapp.blobRef).equal(record.blobRef)
      expect(dapp.dataFormat).equal(record.dataFormat)
      expect(dapp.description).equal(record.description)
      expect(dapp.owner).equal(record.owner)
    })

    it('should transfer ownership', async () => {
      let query = ens.filters.NewOwner(null, null, null)
      let logs = await ens.queryFilter(query)
      const node = logs[0].args[0]

      const [owner, acct1] = await ethers.getSigners()
      await dappRegistry.setOwner(acct1.address, node)
      query = dappRegistry.filters.TransferRecord(null, null, null)
      logs = await dappRegistry.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal(owner.address)
      expect(log[1]).equal(acct1.address)
      expect(log[2]).equal(node)
    })
  })
})
