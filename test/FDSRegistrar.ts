/* eslint-disable node/no-unsupported-features/es-syntax */
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DummyDNSSEC, ENSRegistry, FDSRegistrar, Root, SubdomainRegistrar, TLDPublicSuffixList } from '../typechain'
import { DNSRegistrar } from '../typechain/DNSRegistrar'
// @ts-ignore
import * as packet from 'dns-packet'

function hexEncodeName(name: string) {
  return '0x' + packet.name.encode(name).toString('hex')
}

function hexEncodeTXT(keys: object) {
  return '0x' + packet.answer.encode(keys).toString('hex')
}
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

async function setTLDsOnRegistry(owner: string, registry: ENSRegistry, registrar: DNSRegistrar, tlds: string[]) {
  if (tlds === undefined) {
    return []
  }

  const transactions = []
  for (const tld of tlds) {
    const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tld))
    if (registrar.address !== (await registry.owner(ethers.utils.namehash(tld)))) {
      console.log(`Transferring .${tld} to new DNS registrar`)
      transactions.push(await registry.setSubnodeOwner(ZERO_HASH, labelhash, registrar.address, { from: owner }))
    }
  }
  return transactions
}

describe('fds registry', () => {
  let dnssec: DummyDNSSEC
  let root: Root
  let suffixes: TLDPublicSuffixList
  let ens: ENSRegistry
  let subdomainRegistry: SubdomainRegistrar
  let registrar: FDSRegistrar
  const now = Math.round(new Date().getTime() / 1000)
  beforeEach(async () => {
    const [owner] = await ethers.getSigners()

    const ENSRegistry = await ethers.getContractFactory('ENSRegistry')
    ens = await ENSRegistry.deploy()
    await ens.deployed()

    const Root = await ethers.getContractFactory('Root')
    root = await Root.deploy(ens.address)
    await root.deployed()

    const DummyDNSSEC = await ethers.getContractFactory('DummyDNSSEC')
    dnssec = await DummyDNSSEC.deploy()
    await dnssec.deployed()

    const TLDPublicSuffixList = await ethers.getContractFactory('TLDPublicSuffixList')
    suffixes = await TLDPublicSuffixList.deploy()
    await suffixes.deployed()

    const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
    registrar = await FDSRegistrar.deploy(dnssec.address, suffixes.address, ens.address)
    await registrar.deployed()

    await root.setController(registrar.address, true)

    const tlds = ['fds']
    await setTLDsOnRegistry(owner.address, ens, registrar, tlds)

    // const SubdomainRegistrar = await ethers.getContractFactory('SubdomainRegistrar')
    // subdomainRegistry = await SubdomainRegistrar.deploy(ens.address, ethers.utils.formatBytes32String('fds'))
    // await subdomainRegistry.deployed()
  })

  it('allows anyone to claim on behalf of the owner of an ENS name', async function () {
    const [account1] = await ethers.getSigners()
    expect(await registrar.oracle()).equal(dnssec.address)
    expect(await registrar.ens()).equal(ens.address)

    const proof = hexEncodeTXT({
      name: '_ens.foo.fds',
      type: 'TXT',
      class: 'IN',
      ttl: 3600,
      data: ['a=' + account1.address],
    })

    await dnssec.setData(16, hexEncodeName('_ens.foo.fds'), now, now, proof)

    await registrar.claim(hexEncodeName('foo.fds'), proof)

    expect(await ens.owner(ethers.utils.namehash('foo.fds'))).equal(account1.address)
  })

  xit('allows the owner to prove-and-claim', async () => {
    const [owner] = await ethers.getSigners()
    const proof = hexEncodeTXT({
      name: '_ens.foo.fds',
      type: 'TXT',
      class: 'IN',
      ttl: 3600,
      data: ['a=' + owner.address],
    })

    await dnssec.setData(16, hexEncodeName('_ens.foo.fds'), now, now, proof)

    await registrar.proveAndClaim(hexEncodeName('foo.fds'), [{ rrset: proof, sig: '0x' }], '0x')

    expect(await ens.owner(ethers.utils.namehash('foo.fds'))).equal(owner.address)
  })

  xdescribe('when creating a new record', () => {
    beforeEach(async () => {
      const [owner] = await ethers.getSigners()
      await subdomainRegistry.register(ethers.utils.toUtf8Bytes('dapp.registry.fds'), owner.address)
      const query = ens.filters.NewOwner(null, null, null)
      const logs = await ens.queryFilter(query)
      const log = logs[0].args
      expect(log[0]).equal('dapp.registry.fds')
      expect(log[0]).equal(owner)
    })
  })
})
