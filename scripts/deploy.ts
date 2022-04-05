import { namehash, keccak256, toUtf8Bytes, hexZeroPad, arrayify } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

const ETH_DOMAIN = 'eth'
const MAIN_SUBDOMAIN = process.env.ENS_DOMAIN || 'fds'
const FULL_SUBDOMAIN = `${MAIN_SUBDOMAIN}.${ETH_DOMAIN}`

async function deployENS() {
  const ENS = await ethers.getContractFactory('ENSRegistry')
  const ens = await ENS.deploy()

  await ens.deployed()

  ens.on('Print', (same, owner, sender, node) => {
    console.log('Print: ', JSON.stringify(same), JSON.stringify(owner), JSON.stringify(sender), JSON.stringify(node))
  })

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)
  // const ownerAddress = await ens.owner(hexZeroPad('0x0', 32))
  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address

  const ethDomainNamehash = keccak256(toUtf8Bytes(ETH_DOMAIN))
  const ethDomainNft = keccak256(new Uint8Array([...new Uint8Array(32), ...arrayify(ethDomainNamehash)]))
  const subdomainHash = keccak256(toUtf8Bytes(MAIN_SUBDOMAIN))
  const fullSubdomainNamahash = namehash(FULL_SUBDOMAIN)

  console.log(`ens.setSubnodeOwner(${hexZeroPad('0x0', 32)}, ${ethDomainNamehash}, ${ownerAddress})`)

  const parentOwner = await ens.owner(new Uint8Array(32))
  console.log(`realOwner of ${hexZeroPad('0x0', 32)}: ${parentOwner}.`)

  await ens.setSubnodeOwner(hexZeroPad('0x0', 32), ethDomainNamehash, ownerAddress)

  await new Promise(resolve => setTimeout(resolve, 15000))

  const parentOwner2 = await ens.owner(ethDomainNft)
  console.log(`2! realOwner of ${ethDomainNft}: ${parentOwner2}.`)
  console.log(`ens.setSubnodeOwner(${ethDomainNft}, ${subdomainHash}, ${ownerAddress})`)
  console.log('hellobello1')
  await ens.setSubnodeOwner(ethDomainNft, subdomainHash, ownerAddress)
  console.log('hellobello2')
  await new Promise(resolve => setTimeout(resolve, 15000))
  console.log('hellobello3')

  await resolver.deployed()
  await ens.setResolver(fullSubdomainNamahash, resolver.address)

  const SubdomainRegistrar = await ethers.getContractFactory('SubdomainRegistrar')
  const registrar = await SubdomainRegistrar.deploy(ens.address, fullSubdomainNamahash)

  console.log(`SubdomainRegistrar deployed to: ${registrar.address}`)

  await registrar.deployed()
  await ens.setSubnodeOwner(ethDomainNft, subdomainHash, registrar.address)

  console.log(`ENSRegistry deployed to:`, ens.address)
}

async function main() {
  await deployENS()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
