import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DappRegistry, ENSRegistry, FDSRegistrar, TestToken } from '../typechain'

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

function sha3(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value))
}

describe('dapp registry', () => {
  let dappRegistry: DappRegistry
  let testToken: TestToken
  let ens: ENSRegistry
  let registrar: FDSRegistrar

  const name = 'Swarm Dapp Registry'
  const amount = ethers.utils.parseEther('1')
  const record = {
    node: 'placeholder',
    owner: '0xC47c055b3EBfA044851Ac87B8240f77DF90fdcB8',
    description: 'NFT Sample Dapp',
    version: 1,
    indexType: 1,
    dataFormat: sha3('beeson'),
    blobRef: '0xfd79d5e0ebd8407e422f53ce1d7c4c41ebf403be55143900f8d1490560294780',
    timestamp: new Date().getTime(),
  }
  before(async () => {
    const [, controllerAccount] = await ethers.getSigners()
    const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
    ens = await ENSRegistry.deploy()
    await ens.deployed()

    const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
    registrar = await FDSRegistrar.deploy(ens.address)
    await registrar.addController(controllerAccount.address)
    await ens.setSubnodeOwner(ZERO_HASH, sha3('fds'), registrar.address)

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
    before(async () => {
      const [owner, controllerAccount] = await ethers.getSigners()

      await registrar.connect(controllerAccount).register(sha3('dapp'), owner.address, 86400)
      expect(await ens.owner(ethers.utils.namehash('dapp.fds'))).equal(owner.address)
      expect(await registrar.ownerOf(sha3('dapp'))).equal(owner.address)
    })

    it('should add dapp record', async () => {
      const node = ethers.utils.namehash('dapp.fds')
      const staked = ethers.utils.parseEther('1')
      record.node = node
      await testToken.approve(dappRegistry.address, staked)
      await dappRegistry.add(node, staked, record)
      const query = dappRegistry.filters.DappRecordAdded(null, null, null)
      const logs = await dappRegistry.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal(node)
    })

    it('should fetch dapp', async () => {
      const node = ethers.utils.namehash('dapp.fds')

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
