// TODO There is a eslint configuration error that needs to be fixed
/* eslint-disable node/no-missing-import */
import { namehash, keccak256, toUtf8Bytes, hexZeroPad } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { waitForTransactionMined } from './utils'

const DOMAIN = 'fds'

async function deployENS() {
  const ENS = await ethers.getContractFactory('ENSRegistry')
  const ens = await ENS.deploy()

  await ens.deployed()

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)

  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address

  const domainNamehash = namehash(DOMAIN)

  await resolver.deployed()

  let tx = await ens.setResolver(domainNamehash, resolver.address)
  await waitForTransactionMined(tx)

  const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
  const registrar = await FDSRegistrar.deploy(ens.address)
  tx = await registrar.addController(ownerAddress)
  await waitForTransactionMined(tx)

  console.log(`FDSRegistrar deployed to: ${registrar.address}`)

  await registrar.deployed()

  tx = await ens.setSubnodeOwner(hexZeroPad('0x0', 32), keccak256(toUtf8Bytes(DOMAIN)), registrar.address)
  await waitForTransactionMined(tx)

  console.log(`ENSRegistry deployed to:`, ens.address)
}

async function main() {
  await deployENS()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
