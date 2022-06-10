import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DappRegistry, ENSRegistry, FDSRegistrar } from '../typechain'

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

function sha3(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value))
}

describe('dapp registry', () => {
  let dappRegistry: DappRegistry
  let ens: ENSRegistry
  let registrar: FDSRegistrar

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

    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    // set ENS and FDS addresses, and configure subdomain (eg dappregistry.fds)
    dappRegistry = await DappRegistry.deploy(ens.address, registrar.address, sha3('dappregistry'))
    await dappRegistry.deployed()
    // set subnode owner and add to controller
    await registrar.setSubnodeOwner(sha3('dappregistry'), dappRegistry.address)
    await registrar.addController(dappRegistry.address)
  })

  describe('when creating a new record', () => {
    it('should add dapp record', async () => {
      const [owner] = await ethers.getSigners()
      record.node = ethers.utils.namehash('nftminter.dappregistry.fds')
      await dappRegistry.add(record.node, sha3('nftminter.dappregistry'), owner.address, 86400, record)
      const query = dappRegistry.filters.DappRecordAdded(null, null, null)
      const logs = await dappRegistry.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal(record.node)
      expect(log[1]).equal(sha3('nftminter.dappregistry'))
      expect(log[2]).equal(86400)
      expect(log[3]).equal(owner.address)

      // expect(await ens.owner(ethers.utils.namehash('nftminter.dappregistry.fds'))).equal(owner.address)
      expect(await registrar.ownerOf(sha3('nftminter.dappregistry'))).equal(owner.address)
    })

    it('should fetch dapp', async () => {
      const node = ethers.utils.namehash('nftminter.dappregistry.fds')

      const dapp = await dappRegistry.get(node)
      expect(dapp.node).equal(node)
      expect(dapp.timestamp).equal(record.timestamp)
      expect(dapp.blobRef).equal(record.blobRef)
      expect(dapp.dataFormat).equal(record.dataFormat)
      expect(dapp.description).equal(record.description)
      expect(dapp.owner).equal(record.owner)
    })

    it('should transfer ownership', async () => {
      const [owner, acct1] = await ethers.getSigners()
      await registrar.transferOwnership(acct1.address)
      const query = registrar.filters.OwnershipTransferred(null, null)
      const logs = await registrar.queryFilter(query)
      const log = logs[0].args
      //      expect(log[0]).equal(acct1.address)
      expect(log[1]).equal(owner.address)
    })
  })
})
