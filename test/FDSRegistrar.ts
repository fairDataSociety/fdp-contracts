import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { FDSRegistrar, ENSRegistry, PublicResolver } from '../typechain'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

function keccak256FromUtf8Bytes(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value))
}

const advanceTime = (delay: number) => ethers.provider.send('evm_increaseTime', [delay])

const mine = () => ethers.provider.send('evm_mine', [])

describe('FDSRegistrar', () => {
  let ownerAccount: SignerWithAddress
  let controllerAccount: SignerWithAddress
  let registrantAccount: SignerWithAddress
  let otherAccount: SignerWithAddress

  let ens: ENSRegistry
  let registrar: FDSRegistrar
  let resolver: PublicResolver
  before(async () => {
    const signers = await ethers.getSigners()
    ownerAccount = signers[0]
    controllerAccount = signers[1]
    registrantAccount = signers[2]
    otherAccount = signers[3]
    const ENS = await ethers.getContractFactory('ENSRegistry')
    ens = await ENS.deploy()
    await ens.deployed()
    const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
    registrar = await FDSRegistrar.deploy(ens.address)
    await registrar.addController(controllerAccount.address)
    await ens.setSubnodeOwner(ZERO_HASH, keccak256FromUtf8Bytes('fds'), registrar.address)

    const publicResolver = await ethers.getContractFactory('PublicResolver')
    resolver = await publicResolver.deploy(ens.address)

    console.log(`PublicResolver deployed to: ${resolver.address}`)
    await resolver.deployed()
    await registrar.setResolver(resolver.address)
  })

  it('should allow new registrations', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.register(keccak256FromUtf8Bytes('newname'), registrantAccount.address, 86400)

    const block = await ethers.provider.getBlock('latest')
    expect(await ens.owner(ethers.utils.namehash('newname.fds'))).equal(registrantAccount.address)
    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('newname'))).equal(registrantAccount.address)
    expect((await registrar.nameExpires(keccak256FromUtf8Bytes('newname'))).toNumber()).equal(block.timestamp + 86400)
  })

  it('should allow registrations without updating the registry', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.registerOnly(keccak256FromUtf8Bytes('silentname'), registrantAccount.address, 86400)
    const block = await ethers.provider.getBlock('latest')
    expect(await ens.owner(ethers.utils.namehash('silentname.fds'))).equal(ZERO_ADDRESS)
    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('silentname'))).equal(registrantAccount.address)
    expect((await registrar.nameExpires(keccak256FromUtf8Bytes('silentname'))).toNumber()).equal(
      block.timestamp + 86400,
    )
  })

  it('should allow renewals', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    const oldExpires = await registrar.nameExpires(keccak256FromUtf8Bytes('newname'))
    await controllerAccountReg.renew(keccak256FromUtf8Bytes('newname'), 86400)
    expect((await registrar.nameExpires(keccak256FromUtf8Bytes('newname'))).toNumber()).equal(
      oldExpires.add(86400).toNumber(),
    )
  })

  it('should only allow the controller to register', async () => {
    const otherAccountReg = registrar.connect(otherAccount)

    try {
      await otherAccountReg.register(keccak256FromUtf8Bytes('foo'), otherAccount.address, 86400, {
        from: otherAccount.address,
      })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }
  })

  it('should only allow the controller to renew', async () => {
    const otherAccountReg = registrar.connect(otherAccount)

    try {
      await otherAccountReg.renew(keccak256FromUtf8Bytes('newname'), 86400, { from: otherAccount.address })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }
  })

  it('should not permit registration of already registered names', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    try {
      await controllerAccountReg.register(keccak256FromUtf8Bytes('newname'), otherAccount.address, 86400, {
        from: controllerAccount.address,
      })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }

    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('newname')), registrantAccount.address)
  })

  it('should not permit renewing a name that is not registered', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)

    try {
      await controllerAccountReg.renew(keccak256FromUtf8Bytes('name3'), 86400, { from: controllerAccount.address })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }
  })

  it('should permit the owner to reclaim a name', async () => {
    await ens.setSubnodeOwner(ZERO_HASH, keccak256FromUtf8Bytes('fds'), ownerAccount.address)
    await ens.setSubnodeOwner(ethers.utils.namehash('fds'), keccak256FromUtf8Bytes('newname'), ZERO_ADDRESS)
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), ZERO_ADDRESS)
    await ens.setSubnodeOwner(ZERO_HASH, keccak256FromUtf8Bytes('fds'), registrar.address)
    const reg = registrar.connect(registrantAccount)
    await reg.reclaim(keccak256FromUtf8Bytes('newname'), registrantAccount.address)
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), registrantAccount.address)
  })

  it('should prohibit anyone else from reclaiming a name', async () => {
    const otherAccountReg = registrar.connect(otherAccount)

    try {
      await otherAccountReg.reclaim(keccak256FromUtf8Bytes('newname'), registrantAccount.address, {
        from: otherAccount.address,
      })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }
  })

  it('should permit the owner to transfer a registration', async () => {
    const reg = registrar.connect(registrantAccount)
    await reg.transferFrom(registrantAccount.address, otherAccount.address, keccak256FromUtf8Bytes('newname'))
    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('newname')), otherAccount.address)
    // Transfer does not update ENS without a call to reclaim.
    expect(await ens.owner(ethers.utils.namehash('newname.fds')), registrantAccount.address)
    const otherAccountReg = registrar.connect(otherAccount)
    await otherAccountReg.transferFrom(
      otherAccount.address,
      registrantAccount.address,
      keccak256FromUtf8Bytes('newname'),
    )
  })

  it('should prohibit anyone else from transferring a registration', async () => {
    const otherAccountReg = registrar.connect(otherAccount)

    try {
      await otherAccountReg.transferFrom(
        otherAccount.address,
        otherAccount.address,
        keccak256FromUtf8Bytes('newname'),
        {
          from: otherAccount.address,
        },
      )
    } catch (e: any) {
      expect(e.message).contain('ERC721: transfer caller is not owner nor approve')
    }
  })

  it('should not permit transfer or reclaim during the grace period', async () => {
    // Advance to the grace period
    const ts = (await ethers.provider.getBlock('latest')).timestamp
    await advanceTime((await registrar.nameExpires(keccak256FromUtf8Bytes('newname'))).toNumber() - ts + 3600)
    await mine()

    const reg = registrar.connect(registrantAccount)

    try {
      await reg.transferFrom(registrantAccount.address, otherAccount.address, keccak256FromUtf8Bytes('newname'), {
        from: registrantAccount.address,
      })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }

    try {
      await reg.reclaim(keccak256FromUtf8Bytes('newname'), registrantAccount.address, {
        from: registrantAccount.address,
      })
    } catch (e: any) {
      expect(e.message).contain('Transaction reverted')
    }
  })

  it('should allow renewal during the grace period', async () => {
    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.renew(keccak256FromUtf8Bytes('newname'), 86400)
  })

  it('should allow registration of an expired domain', async () => {
    const ts = (await ethers.provider.getBlock('latest')).timestamp
    const expires = await registrar.nameExpires(keccak256FromUtf8Bytes('newname'))
    const grace = await registrar.GRACE_PERIOD()
    await advanceTime(expires.toNumber() - ts + grace.toNumber() + 3600)

    try {
      await registrar.ownerOf(keccak256FromUtf8Bytes('newname'))
    } catch (error) {}

    const controllerAccountReg = registrar.connect(controllerAccount)
    await controllerAccountReg.register(keccak256FromUtf8Bytes('newname'), otherAccount.address, 86400, {
      from: controllerAccount.address,
    })
    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('newname')), otherAccount.address)
  })

  it('should allow the owner to set a resolver address', async () => {
    const ownerReg = registrar.connect(ownerAccount)
    await ownerReg.setResolver(controllerAccount.address)
    expect(await ens.resolver(ethers.utils.namehash('fds')), controllerAccount.address)
  })
})
