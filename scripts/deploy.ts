import { Transaction } from 'ethers'
import { namehash, keccak256, toUtf8Bytes, hexZeroPad } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { ENSRegistry } from '../typechain'

const ETH_DOMAIN = 'eth'
const MAIN_SUBDOMAIN = process.env.ENS_DOMAIN || 'fds'
const FULL_SUBDOMAIN = `${MAIN_SUBDOMAIN}.${ETH_DOMAIN}`

const INTERVAL = 1000
const MAX_INTERVAL = 15 * INTERVAL

function waitForTransactionMined(tx: Transaction): Promise<void> {
  return new Promise((resolve, reject) => {
    let elapsedMs = 0
    const intervalHandle = setInterval(async () => {
      try {
        const txResult = await ethers.provider.getTransaction(tx.hash as string)
        if (txResult.blockNumber) {
          clearInterval(intervalHandle)
          return resolve()
        }
        elapsedMs += INTERVAL
        if (elapsedMs >= MAX_INTERVAL) {
          clearInterval(intervalHandle)
          reject('Transaction mining timeout has expired')
        }
      } catch (error) {
        clearInterval(intervalHandle)
        reject(error)
      }
    }, INTERVAL)
  })
}

async function deployENS() {
  const ENS = await ethers.getContractFactory('ENSRegistry')
  const ens = await ENS.deploy()

  await ens.deployed()

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)

  const [owner] = await ethers.getSigners()
  const ownerAddress = owner.address

  const ethDomainNamehash = namehash(ETH_DOMAIN)
  const subdomainHash = keccak256(toUtf8Bytes(MAIN_SUBDOMAIN))
  const fullSubdomainNamahash = namehash(FULL_SUBDOMAIN)

  let tx = await ens.setSubnodeOwner(hexZeroPad('0x0', 32), keccak256(toUtf8Bytes(ETH_DOMAIN)), ownerAddress)
  await waitForTransactionMined(tx)

  tx = await ens.setSubnodeOwner(ethDomainNamehash, subdomainHash, ownerAddress)
  await waitForTransactionMined(tx)

  await resolver.deployed()
  await ens.setResolver(fullSubdomainNamahash, resolver.address)

  const SubdomainRegistrar = await ethers.getContractFactory('SubdomainRegistrar')
  const registrar = await SubdomainRegistrar.deploy(ens.address, fullSubdomainNamahash)

  console.log(`SubdomainRegistrar deployed to: ${registrar.address}`)

  await registrar.deployed()
  await ens.setSubnodeOwner(ethDomainNamehash, subdomainHash, registrar.address)

  console.log(`ENSRegistry deployed to:`, ens.address)
}

async function main() {
  await deployENS()
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
