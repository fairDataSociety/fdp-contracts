import { expect } from 'chai'
import { ethers } from 'hardhat'
import { DappRegistry } from '../typechain'

describe('dapp registry', () => {
  let dappRegistry: DappRegistry
  const name = 'Swarm Dapp Registry'
  const token = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  const ens = '0x54247f84A6c8857d3214A298925A099aa0eDE08A'
  const amount = ethers.BigNumber.from(10).pow(18)
  const expiry = new Date().getTime() + 10000000000
  const commit = new Date().getTime() + 1000000
  before(async () => {
    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    dappRegistry = await DappRegistry.deploy(name, token, ens, amount.toString(), expiry.toString(), commit.toString())
    await dappRegistry.deployed()
  })

  it('should get registry details', async () => {
    const details = await dappRegistry.getDetails()
    expect(name).equal(details[0])
    expect(token).equal(details[1])
    expect(amount).equal(details[2])
    expect(expiry.toString()).equal(details[3])
    expect(commit.toString()).equal(details[4])
  })

  xit('should send propose to mint nft', async () => {
    const details = await dappRegistry.getDetails()
    expect(name).equal(details[0])
    expect(token).equal(details[1])
    expect(amount).equal(details[2])
    expect(expiry.toString()).equal(details[3])
    expect(commit.toString()).equal(details[4])
  })

  xit('should challenge proposal', async () => {
    const details = await dappRegistry.getDetails()
    expect(name).equal(details[0])
    expect(token).equal(details[1])
    expect(amount).equal(details[2])
    expect(expiry.toString()).equal(details[3])
    expect(commit.toString()).equal(details[4])
  })

  xit('should get list of dapps', async () => {
    const details = await dappRegistry.getDetails()
    expect(name).equal(details[0])
    expect(token).equal(details[1])
    expect(amount).equal(details[2])
    expect(expiry.toString()).equal(details[3])
    expect(commit.toString()).equal(details[4])
  })
})
