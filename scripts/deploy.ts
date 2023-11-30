// TODO There is a eslint configuration error that needs to be fixed
import { utils } from 'ethers'
import { keccak256, toUtf8Bytes, hexZeroPad } from 'ethers/lib/utils'
import { ethers, network } from 'hardhat'
import getChanges, { ContractsChange } from './get-changes'
import { waitForTransactionMined } from './utils'

const DOMAIN = 'fds'
const VALIDATOR_ROLE = utils.keccak256(utils.toUtf8Bytes('VALIDATOR_ROLE'))

async function deployENS() {
  const ENS = await ethers.getContractFactory('contracts/ENSRegistry.sol:ENSRegistry')
  const ens = await ENS.deploy()

  let tx
  await ens.deployed()
  console.log(`ENSRegistry deployed to:`, ens.address)

  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address

  const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
  const registrar = await FDSRegistrar.deploy(ens.address)
  console.log(`FDSRegistrar deployed to: ${registrar.address}`)

  tx = await registrar.addController(ownerAddress)
  await waitForTransactionMined(tx)
  console.log('FDSRegistrar.addController success')

  await registrar.deployed()

  tx = await ens.setSubnodeOwner(hexZeroPad('0x0', 32), keccak256(toUtf8Bytes(DOMAIN)), registrar.address)
  await waitForTransactionMined(tx)
  console.log('ENSRegistry.setSubnodeOwner success')

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)

  await resolver.deployed()

  tx = await registrar.setResolver(resolver.address)
  await waitForTransactionMined(tx)
  console.log('FDSRegistrar.setResolver success')

  const FDSReverseRegistrar = await ethers.getContractFactory('FDSReverseRegistrar')
  const reverseRegistrar = await FDSReverseRegistrar.deploy(ens.address)
  console.log(`FDSReverseRegistrar deployed to: ${reverseRegistrar.address}`)

  const FDSNameResolver = await ethers.getContractFactory('FDSNameResolver')
  const nameResolver = await FDSNameResolver.deploy(reverseRegistrar.address)
  console.log(`FDSNameResolver deployed to: ${nameResolver.address}`)

  tx = await reverseRegistrar.setDefaultResolver(nameResolver.address)
  await waitForTransactionMined(tx)
  console.log('FDSReverseRegistrar.setDefaultResolver success')

  tx = await reverseRegistrar.setName(DOMAIN)
  await waitForTransactionMined(tx)
  console.log('reverseRegistrar.setName success')
}

async function deployDappRegistry() {
  const DappRegistry = await ethers.getContractFactory('DappRegistry')
  const dappRegistry = await DappRegistry.deploy()

  await dappRegistry.deployed()

  console.log(`DappRegistry deployed to: ${dappRegistry.address}`)

  if (process.env.VALIDATOR_ADDRESS) {
    const tx = await dappRegistry.grantRole(VALIDATOR_ROLE, process.env.VALIDATOR_ADDRESS)

    await waitForTransactionMined(tx)

    console.log(`VALIDATOR_ROLE granted to ${process.env.VALIDATOR_ADDRESS} address`)
  }
}

async function deployRatings() {
  const Ratings = await ethers.getContractFactory('Ratings')
  const ratings = await Ratings.deploy()

  await ratings.deployed()

  console.log(`Ratings deployed to: ${ratings.address}`)
}

async function main() {
  let changes: ContractsChange[] = ['ENS', 'BMT', 'DAPP_REGISTRY', 'RATINGS']

  if (network.name !== 'localhost' && network.name !== 'docker') {
    changes = await getChanges()
  }
  console.log('Detected changes for contracts: ', changes)

  if (changes.includes('ENS')) {
    console.log('Deploying ENS contracts')
    await deployENS()
  }

  if (changes.includes('DAPP_REGISTRY')) {
    console.log('Deploying DappRegistry contract')
    await deployDappRegistry()
  }

  if (changes.includes('DAPP_REGISTRY') || changes.includes('RATINGS')) {
    console.log('Deploying Ratings contract')
    await deployRatings()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
