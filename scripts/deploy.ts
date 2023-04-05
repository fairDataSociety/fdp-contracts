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
  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address

  const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
  const registrar = await FDSRegistrar.deploy(ens.address)
  tx = await registrar.addController(ownerAddress)
  await waitForTransactionMined(tx)

  console.log(`FDSRegistrar deployed to: ${registrar.address}`)

  await registrar.deployed()

  tx = await ens.setSubnodeOwner(hexZeroPad('0x0', 32), keccak256(toUtf8Bytes(DOMAIN)), registrar.address)
  await waitForTransactionMined(tx)

  console.log(`ENSRegistry deployed to:`, ens.address)

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)

  await resolver.deployed()

  tx = await registrar.setResolver(resolver.address)
  await waitForTransactionMined(tx)
}

async function deployDappRegistry() {
  const DappRegistry = await ethers.getContractFactory('DappRegistry')
  const dappRegistry = await DappRegistry.deploy()

  await dappRegistry.deployed()

  if (process.env.VALIDATOR_ADDRESS) {
    const tx = await dappRegistry.grantRole(VALIDATOR_ROLE, process.env.VALIDATOR_ADDRESS)

    await waitForTransactionMined(tx)

    console.log(`VALIDATOR_ROLE granted to ${process.env.VALIDATOR_ADDRESS} address`)
  }

  console.log(`DappRegistry deployed to: ${dappRegistry.address}`)
}

async function main() {
  let changes: ContractsChange[] = ['ENS', 'BMT', 'DAPP_REGISTRY']

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
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
