import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BaseRegistrarImplementation, ENSRegistry } from '../typechain'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

function sha3(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value))
}

describe('BaseRegistrar', () => {
  let ownerAccount: SignerWithAddress
  let controllerAccount: SignerWithAddress
  let registrantAccount: SignerWithAddress
  let otherAccount: SignerWithAddress

  let ens: ENSRegistry
  let registrar: BaseRegistrarImplementation

  before(async () => {
    const signers = await ethers.getSigners()
    ownerAccount = signers[0]
    controllerAccount = signers[1]
    registrantAccount = signers[2]
    otherAccount = signers[3]
    const ENS = await ethers.getContractFactory('ENSRegistry')
    ens = await ENS.deploy()
    await ens.deployed()

    const BaseRegistrar = await ethers.getContractFactory('BaseRegistrarImplementation')
    registrar = await BaseRegistrar.deploy(ens.address, ethers.utils.namehash('fds'))
    await registrar.addController(controllerAccount.address)
    await ens.setSubnodeOwner(ZERO_HASH, sha3('fds'), registrar.address)
  })

  it('should allow new registrations', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.register(sha3('newname'), registrantAccount.address, 86400)
    const block = await ethers.provider.getBlock('latest')
    expect(await ens.owner(ethers.utils.namehash('newname.fds'))).equal(registrantAccount.address)
    expect(await registrar.ownerOf(sha3('newname'))).equal(registrantAccount.address)
    expect((await registrar.nameExpires(sha3('newname'))).toNumber()).equal(block.timestamp + 86400)
  })

  it('should allow registrations without updating the registry', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.registerOnly(sha3('silentname'), registrantAccount.address, 86400)
    const block = await ethers.provider.getBlock('latest')
    expect(await ens.owner(ethers.utils.namehash('silentname.fds'))).equal(ZERO_ADDRESS)
    expect(await registrar.ownerOf(sha3('silentname'))).equal(registrantAccount.address)
    expect((await registrar.nameExpires(sha3('silentname'))).toNumber()).equal(block.timestamp + 86400)
  })

  it('should allow renewals', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    const oldExpires = await registrar.nameExpires(sha3('newname'))
    await controllerAccountReg.renew(sha3('newname'), 86400)
    expect((await registrar.nameExpires(sha3('newname'))).toNumber()).equal(oldExpires.add(86400).toNumber())
  })

  //   it('should only allow the controller to register', async () => {
  //     await exceptions.expectFailure(registrar.register(sha3('foo'), otherAccount, 86400, { from: otherAccount }))
  //   })

  //   it('should only allow the controller to renew', async () => {
  //     await exceptions.expectFailure(registrar.renew(sha3('newname'), 86400, { from: otherAccount }))
  //   })

  //   it('should not permit registration of already registered names', async () => {
  //     await exceptions.expectFailure(
  //       registrar.register(sha3('newname'), otherAccount, 86400, { from: controllerAccount }),
  //     )
  //     expect(await registrar.ownerOf(sha3('newname')), registrantAccount)
  //   })

  //   it('should not permit renewing a name that is not registered', async () => {
  //     await exceptions.expectFailure(registrar.renew(sha3('name3'), 86400, { from: controllerAccount }))
  //   })

  it('should permit the owner to reclaim a name', async () => {
    await ens.setSubnodeOwner(ZERO_HASH, sha3('fds'), ownerAccount.address)
    await ens.setSubnodeOwner(ethers.utils.namehash('fds'), sha3('newname'), ZERO_ADDRESS)
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), ZERO_ADDRESS)
    await ens.setSubnodeOwner(ZERO_HASH, sha3('fds'), registrar.address)
    const reg = registrar.connect(registrantAccount)
    await reg.reclaim(sha3('newname'), registrantAccount.address)
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), registrantAccount.address)
  })

  //   it('should prohibit anyone else from reclaiming a name', async () => {
  //     await exceptions.expectFailure(registrar.reclaim(sha3('newname'), registrantAccount, { from: otherAccount }))
  //   })

  it('should permit the owner to transfer a registration', async () => {
    const reg = registrar.connect(registrantAccount)
    await reg.transferFrom(registrantAccount.address, otherAccount.address, sha3('newname'))
    expect(await registrar.ownerOf(sha3('newname')), otherAccount.address)
    // Transfer does not update ENS without a call to reclaim.
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), registrantAccount.address)
    const otherAccountReg = registrar.connect(otherAccount)
    await otherAccountReg.transferFrom(otherAccount.address, registrantAccount.address, sha3('newname'))
  })

  //   it('should prohibit anyone else from transferring a registration', async () => {
  //     await exceptions.expectFailure(
  //       registrar.transferFrom(otherAccount, otherAccount, sha3('newname'), { from: otherAccount }),
  //     )
  //   })

  //   it('should not permit transfer or reclaim during the grace period', async () => {
  //     // Advance to the grace period
  //     const ts = (await web3.eth.getBlock('latest')).timestamp
  //     await evm.advanceTime((await registrar.nameExpires(sha3('newname'))).toNumber() - ts + 3600)
  //     await evm.mine()
  //     await exceptions.expectFailure(
  //       registrar.transferFrom(registrantAccount, otherAccount, sha3('newname'), { from: registrantAccount }),
  //     )
  //     await exceptions.expectFailure(registrar.reclaim(sha3('newname'), registrantAccount, { from: registrantAccount }))
  //   })

  it('should allow renewal during the grace period', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.renew(sha3('newname'), 86400)
  })

  //   it('should allow registration of an expired domain', async () => {
  //     const ts = (await web3.eth.getBlock('latest')).timestamp
  //     const expires = await registrar.nameExpires(sha3('newname'))
  //     const grace = await registrar.GRACE_PERIOD()
  //     await evm.advanceTime(expires.toNumber() - ts + grace.toNumber() + 3600)

  //     try {
  //       await registrar.ownerOf(sha3('newname'))
  //       assert.fail('should throw an exception')
  //     } catch (error) {}

  //     await registrar.register(sha3('newname'), otherAccount, 86400, { from: controllerAccount })
  //     expect(await registrar.ownerOf(sha3('newname')), otherAccount)
  //   })

  it('should allow the owner to set a resolver address', async () => {
    const ownerReg = registrar.connect(ownerAccount)
    await ownerReg.setResolver(controllerAccount.address)
    expect(await ens.resolver(ethers.utils.namehash('fds')), controllerAccount.address)
  })
})
