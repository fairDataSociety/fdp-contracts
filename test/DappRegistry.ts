import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import { DappRegistry } from '../typechain'

function createRecordHash(recordHash: number) {
  return utils.hexZeroPad(utils.hexlify(recordHash), 32)
}

describe('DappRegistry tests', () => {
  let ownerAccount: SignerWithAddress
  let adminAccount: SignerWithAddress
  let validatorAccount: SignerWithAddress
  let userAccount: SignerWithAddress

  let dappRegistry: DappRegistry

  before(async () => {
    const signers = await ethers.getSigners()
    ownerAccount = signers[0]
    adminAccount = signers[1]
    validatorAccount = signers[2]
    userAccount = signers[3]

    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    dappRegistry = await DappRegistry.deploy()
    await dappRegistry.deployed()
  })

  it('Should grant admin access', async () => {
    const ownerDappRegistry = dappRegistry.connect(ownerAccount)
    await ownerDappRegistry.grantAdminRole(adminAccount.address)
    const isAdmin = await ownerDappRegistry.isAdmin(adminAccount.address)
    expect(isAdmin).equal(true)
  })

  it('Should grant validator access', async () => {
    const adminDappRegistry = dappRegistry.connect(adminAccount)
    await adminDappRegistry.grantValidatorRole(validatorAccount.address)
    const isValidator = await adminDappRegistry.isValidator(validatorAccount.address)
    expect(isValidator).equal(true)
  })

  it('Should add new dApp records', async () => {
    const adminDappRegistry = dappRegistry.connect(adminAccount)

    await adminDappRegistry.craeteRecord(createRecordHash(10), createRecordHash(10 << 8))

    const record = await adminDappRegistry.getRecord(10)

    expect(record[0]).equal(adminAccount.address)
    expect(record[1]).equal(10)
    expect(record[2]).equal(10 << 8)
    expect(record[3]).equal(0)
    expect(record[4]).equal(0)

    const userDappRegistry = dappRegistry.connect(userAccount)
    const recordHashes = [1, 2, 3]
    await Promise.all(
      recordHashes.map(recordHash => {
        const hash = createRecordHash(recordHash)
        const urlHash = createRecordHash(recordHash << 8)
        return userDappRegistry.craeteRecord(hash, urlHash)
      }),
    )

    await Promise.all(
      recordHashes.map(async recordHash => {
        const record = await userDappRegistry.getRecord(recordHash)

        expect(record[0]).equal(userAccount.address)
        expect(record[1]).equal(recordHash)
        expect(record[2]).equal(recordHash << 8)
        expect(record[3]).equal(recordHash)
        expect(record[4]).equal(recordHash - 1)
      }),
    )

    const user = await userDappRegistry.getUser(userAccount.address)

    user.records.forEach((hash, index) => expect(hash).equal(recordHashes[index]))
  })

  it("User how is not owner shouldn't be able to delete records", async () => {
    const validatorDappRegistry = dappRegistry.connect(validatorAccount)
    let correctError = false
    try {
      await validatorDappRegistry.deleteRecord(createRecordHash(2))
    } catch (error) {
      correctError = String(error).includes('Sender is not owner')
    }

    expect(correctError).equal(true)
  })

  it('User should be able to delete own records', async () => {
    const userDappRegistry = dappRegistry.connect(userAccount)

    await userDappRegistry.deleteRecord(createRecordHash(2))

    await Promise.all(
      [1, 3].map(async recordHash => {
        const record = await userDappRegistry.getRecord(recordHash)

        expect(record[0]).equal(userAccount.address)
        expect(record[1]).equal(recordHash)
        expect(record[2]).equal(recordHash << 8)
        expect(record[3]).equal(recordHash === 1 ? 1 : 2)
        expect(record[4]).equal(recordHash === 1 ? 0 : 1)
      }),
    )

    await userDappRegistry.deleteRecord(createRecordHash(1))

    const record = await userDappRegistry.getRecord(3)

    expect(record[0]).equal(userAccount.address)
    expect(record[1]).equal(3)
    expect(record[2]).equal(3 << 8)
    expect(record[3]).equal(1)
    expect(record[4]).equal(0)
  })
})
