import { ethers } from 'hardhat'
import { ZERO_HASH, initializeEns, keccak256FromUtf8Bytes } from './utils/ens'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ENSRegistry, FDSNameResolver, FDSRegistrar, FDSReverseRegistrar } from '../typechain'
import { expect } from 'chai'
import { namehash } from 'ethers/lib/utils'

function addressToNode(address: string): string {
  return namehash(address.toLowerCase().substr(2) + '.addr.reverse')
}
describe('FDSReverseRegistrar', () => {
  let ownerAccount: SignerWithAddress
  let controllerAccount: SignerWithAddress
  let registrantAccount: SignerWithAddress

  let ens: ENSRegistry
  let registrar: FDSRegistrar
  let reverseRegistrar: FDSReverseRegistrar
  let nameResolver: FDSNameResolver

  before(async () => {
    const signers = await ethers.getSigners()
    ownerAccount = signers[0]
    controllerAccount = signers[1]
    registrantAccount = signers[2]

    const ensContracts = await initializeEns(controllerAccount)

    ens = ensContracts.ens
    registrar = ensContracts.registrar
    reverseRegistrar = ensContracts.reverseRegistrar
    nameResolver = ensContracts.nameResolver
  })

  it("Shouldn't register name if account is not owner or admin", async () => {
    const connectedReverseRegistrar = reverseRegistrar.connect(registrantAccount)
    let errorMessage: string = ''

    try {
      await connectedReverseRegistrar.setName('user')
    } catch (error) {
      errorMessage = String(error)
    }

    expect(
      errorMessage.indexOf(
        'ReverseRegistrar: Caller is not a controller or authorised by address or the address itself',
      ),
    ).greaterThanOrEqual(0)
  })

  it('Should register name if account is owner', async () => {
    const registrantRegistrar = registrar.connect(registrantAccount)
    await registrantRegistrar.register(keccak256FromUtf8Bytes('newname'), registrantAccount.address, 86400)

    const nameHash = ethers.utils.namehash('newname.fds')
    const addressHash = addressToNode(registrantAccount.address)

    expect(await nameResolver.name(addressHash)).equal(ZERO_HASH)
    expect(await ens.owner(nameHash)).equal(registrantAccount.address)
    expect(await registrar.ownerOf(keccak256FromUtf8Bytes('newname'))).equal(registrantAccount.address)

    const registrantReverseRegistrar = reverseRegistrar.connect(registrantAccount)

    await (await registrantReverseRegistrar.setName('newname')).wait()

    const ensNode = await nameResolver.name(addressHash)

    expect(await ens.owner(ensNode)).equal(registrantAccount.address)
  })

  it('Should register account if account is admin', async () => {
    const ownerReverseRegistrar = reverseRegistrar.connect(ownerAccount)

    await (await ownerReverseRegistrar.setName('newname')).wait()

    const ensNode = await nameResolver.name(addressToNode(ownerAccount.address))

    expect(await ens.owner(ensNode)).equal(registrantAccount.address)
  })
})
