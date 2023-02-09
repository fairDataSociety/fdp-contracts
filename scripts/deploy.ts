// TODO There is a eslint configuration error that needs to be fixed
import { keccak256, toUtf8Bytes, hexZeroPad } from 'ethers/lib/utils'
import { ethers, network } from 'hardhat'
import { promisify } from 'util'
import { waitForTransactionMined } from './utils'
import childProcess from 'child_process'

const exec = promisify(childProcess.exec)

let changes = ['ENS', 'BMT', 'DAPP_REGISTRY']

async function loadChanges(): Promise<string[]> {
  const { stdout, stderr } = await exec('./scripts/get-changes.sh')
  if (stderr) {
    throw new Error(stderr)
  }
  return stdout.trim().split(' ')
}

const DOMAIN = 'fds'

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

async function main() {
  if (network.name !== 'localhost' && network.name !== 'docker') {
    changes = await loadChanges()
  }
  console.log('Detected changes for contracts: ', changes)

  if (changes.includes('ENS')) {
    console.log('Deploying ENS contracts')
    await deployENS()
  }
  // TODO Uncomment when dapp registry gets merged
  // if (changes.includes('DAPP_REGISTRY')) {
  //   console.log('Deploying the DappRegistry contract')
  //   await deployDappRegistry()
  // }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
