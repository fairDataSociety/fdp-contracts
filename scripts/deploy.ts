import { namehash, keccak256, toUtf8Bytes, hexZeroPad } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

async function deployENS() {
  const ENS = await ethers.getContractFactory('ENSRegistry')
  const ens = await ENS.deploy()

  await ens.deployed()

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)

  const ownerAddress = await ens.owner(hexZeroPad('0x0', 32))

  await ens.setSubnodeOwner(hexZeroPad('0x0', 32), keccak256(toUtf8Bytes('eth')), ownerAddress)
  await ens.setSubnodeOwner(namehash('eth'), keccak256(toUtf8Bytes('datafund')), ownerAddress)

  await resolver.deployed()
  await ens.setResolver(namehash('datafund.eth'), resolver.address)

  const SubdomainRegistrar = await ethers.getContractFactory('SubdomainRegistrar')
  const registrar = await SubdomainRegistrar.deploy(ens.address, namehash('datafund.eth'))

  console.log(`SubdomainRegistrar deployed to: ${registrar.address}`)

  await registrar.deployed()
  await ens.setSubnodeOwner(namehash('eth'), keccak256(toUtf8Bytes('datafund')), registrar.address)

  console.log(`ENSRegistry deployed to:`, ens.address)
}

async function main() {
  await deployENS()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
