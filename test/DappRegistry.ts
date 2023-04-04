import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import { DappRegistry } from '../typechain'

function createHash(recordHash: number) {
  return utils.hexZeroPad(utils.hexlify(recordHash), 32)
}

const ADMIN_ROLE = utils.hexZeroPad(utils.hexlify(0), 32)
const VALIDATOR_ROLE = utils.keccak256(utils.toUtf8Bytes('VALIDATOR_ROLE'))

describe('DappRegistry tests', () => {
  let ownerAccount: SignerWithAddress
  let adminAccount: SignerWithAddress
  let validatorAccount: SignerWithAddress
  let userAccount1: SignerWithAddress
  let userAccount2: SignerWithAddress
  let userAccount3: SignerWithAddress

  let dappRegistry: DappRegistry

  before(async () => {
    const signers = await ethers.getSigners()
    ownerAccount = signers[0]
    adminAccount = signers[1]
    validatorAccount = signers[2]
    userAccount1 = signers[3]
    userAccount2 = signers[4]
    userAccount3 = signers[5]

    const DappRegistry = await ethers.getContractFactory('DappRegistry')
    dappRegistry = await DappRegistry.deploy()
    await dappRegistry.deployed()
  })

  it('Should grant admin access', async () => {
    const ownerDappRegistry = dappRegistry.connect(ownerAccount)
    await ownerDappRegistry.grantRole(ADMIN_ROLE, adminAccount.address)
    const isAdmin = await ownerDappRegistry.hasRole(ADMIN_ROLE, adminAccount.address)
    expect(isAdmin).equal(true)
  })

  it('Should grant validator access', async () => {
    const adminDappRegistry = dappRegistry.connect(adminAccount)
    await adminDappRegistry.grantRole(VALIDATOR_ROLE, validatorAccount.address)
    const isValidator = await adminDappRegistry.hasRole(VALIDATOR_ROLE, validatorAccount.address)
    expect(isValidator).equal(true)
  })

  function createUserRecords(userDappRegistry: DappRegistry, recordHashes: number[]) {
    return Promise.all(
      recordHashes.map(recordHash => {
        const hash = createHash(recordHash)
        const urlHash = createHash(recordHash)
        return userDappRegistry.createRecord(hash, urlHash)
      }),
    )
  }

  async function checkUserRecords(
    userDappRegistry: DappRegistry,
    locations: number[],
    indices: number[],
    userIndices: number[],
    address: string,
  ) {
    const records = await userDappRegistry.getUserRecordHashes(address)

    await Promise.all(
      records.map(async (recordHash, index) => {
        const record = await userDappRegistry.getRecord(recordHash)
        expect(record[1]).equal(address) // address
        expect(record[2]).equal(createHash(locations[index])) // location
        expect(record[3]).equal(createHash(locations[index])) // urlHash
        expect(record[5]).equal(indices[index]) // index
        expect(record[6]).equal(userIndices[index]) // creatorIndex
      }),
    )
  }

  it('Multiple users should be able to add records', async () => {
    await createUserRecords(dappRegistry.connect(userAccount1), [1])
    await createUserRecords(dappRegistry.connect(userAccount2), [2])
    await createUserRecords(dappRegistry.connect(userAccount3), [3])
    await createUserRecords(dappRegistry.connect(userAccount1), [4])
    await createUserRecords(dappRegistry.connect(userAccount2), [5])
    await createUserRecords(dappRegistry.connect(userAccount3), [6])
    await createUserRecords(dappRegistry.connect(userAccount1), [7])

    await checkUserRecords(dappRegistry.connect(userAccount1), [1, 4, 7], [0, 3, 6], [0, 1, 2], userAccount1.address)
    await checkUserRecords(dappRegistry.connect(userAccount2), [2, 5], [1, 4], [0, 1], userAccount2.address)
    await checkUserRecords(dappRegistry.connect(userAccount3), [3, 6], [2, 5], [0, 1], userAccount3.address)
  })

  it('User should be able to edit record', async () => {
    const user1DappRegistry = dappRegistry.connect(userAccount1)

    const records = await user1DappRegistry.getUserRecordHashes(userAccount1.address)
    let record = await user1DappRegistry.getRecord(records[1])

    expect(record[2]).equals(createHash(4))

    await user1DappRegistry.editRecord(records[1], createHash(8))

    record = await user1DappRegistry.getRecord(records[1])

    expect(record[2]).equals(createHash(8))
  })

  it("User who is not owner shouldn't be able to edit records", async () => {
    const validatorDappRegistry = dappRegistry.connect(validatorAccount)
    const records = await validatorDappRegistry.getUserRecordHashes(userAccount1.address)
    let correctError = false
    try {
      await validatorDappRegistry.editRecord(records[1], createHash(9))
    } catch (error) {
      correctError = String(error).includes('Sender is not owner')
    }

    expect(correctError).equal(true)
  })

  it('Should return correct record count', async () => {
    const count = await dappRegistry.getRecordCount()
    expect(count).equals(7)
  })

  it('Should fetch right records', async () => {
    const recordHashes = await dappRegistry.getRecordSlice(1, 3)
    const locations = [2, 3, 8]

    expect(recordHashes.length).equals(3)
    await Promise.all(
      recordHashes.map(async (recordHash, index) => {
        const record = await dappRegistry.getRecord(recordHash)

        expect(record[2]).equals(createHash(locations[index]))
      }),
    )
  })

  it('Should validate records and unvalidate on edit', async () => {
    const validatorDappRegistry = dappRegistry.connect(validatorAccount)

    const [recordHash] = await validatorDappRegistry.getRecordSlice(0, 1)

    await validatorDappRegistry.validateRecord(recordHash)

    const validatedRecords = await validatorDappRegistry.getValidatedRecords(validatorAccount.address)

    expect(validatedRecords.length).equals(1)

    let record = await dappRegistry.getRecord(recordHash)
    expect(record[2]).equals(createHash(1))
    expect(record[4]).equals(false)

    await dappRegistry.connect(userAccount1).editRecord(recordHash, createHash(9))

    record = await dappRegistry.getRecord(recordHash)
    expect(record[2]).equals(createHash(9))
    expect(record[4]).equals(true)
  })
})
