import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import { DappRegistry } from '../typechain'

function createRecordHash(recordHash: number) {
  return utils.hexZeroPad(utils.hexlify(recordHash), 32)
}

const ADMIN_ROLE = utils.hexZeroPad(utils.hexlify(0), 32)

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

  function createUserRecords(userDappRegistry: DappRegistry, recordHashes: number[]) {
    return Promise.all(
      recordHashes.map(recordHash => {
        const hash = createRecordHash(recordHash)
        const urlHash = createRecordHash(recordHash)
        return userDappRegistry.createRecord(hash, urlHash)
      }),
    )
  }

  function checkUserRecords(
    userDappRegistry: DappRegistry,
    recordHashes: number[],
    indices: number[],
    userIndices: number[],
    address: string,
  ) {
    return Promise.all(
      recordHashes.map(async (recordHash, index) => {
        const record = await userDappRegistry.getRecord(createRecordHash(recordHash))

        const hash = createRecordHash(recordHash)

        expect(record[0]).equal(address) // address
        expect(record[1]).equal(hash) // location
        expect(record[2]).equal(hash) // urlHash
        expect(record[3]).equal(indices[index]) // index
        expect(record[4]).equal(userIndices[index]) // creatorIndex
      }),
    )
  }

  async function checkUser(userDappRegistry: DappRegistry, recordHashes: number[], address: string) {
    const user = await userDappRegistry.getUser(address)

    user.records.forEach((hash, index) => expect(hash).equal(createRecordHash(recordHashes[index])))
  }

  it('Adding multiple records and deleting them should return state to initial', async () => {
    await createUserRecords(dappRegistry.connect(userAccount1), [1])
    await createUserRecords(dappRegistry.connect(userAccount2), [2])
    await createUserRecords(dappRegistry.connect(userAccount3), [3])
    await createUserRecords(dappRegistry.connect(userAccount1), [4])
    await createUserRecords(dappRegistry.connect(userAccount2), [5])
    await createUserRecords(dappRegistry.connect(userAccount3), [6])
    await createUserRecords(dappRegistry.connect(userAccount1), [7])

    await dappRegistry.connect(userAccount3).deleteRecord(createRecordHash(3))
    await dappRegistry.connect(userAccount2).deleteRecord(createRecordHash(5))
    await dappRegistry.connect(userAccount1).deleteRecord(createRecordHash(7))

    await checkUserRecords(dappRegistry.connect(userAccount1), [1, 4], [0, 3], [0, 1], userAccount1.address)
    await checkUserRecords(dappRegistry.connect(userAccount2), [2], [1], [0], userAccount2.address)
    await checkUserRecords(dappRegistry.connect(userAccount3), [6], [5], [0], userAccount3.address)

    await dappRegistry.connect(userAccount1).deleteRecord(createRecordHash(1))
    await dappRegistry.connect(userAccount3).deleteRecord(createRecordHash(6))
    await dappRegistry.connect(userAccount2).deleteRecord(createRecordHash(2))

    await checkUserRecords(dappRegistry.connect(userAccount1), [4], [3], [0], userAccount1.address)
    await checkUserRecords(dappRegistry.connect(userAccount2), [], [], [], userAccount2.address)
    await checkUserRecords(dappRegistry.connect(userAccount3), [], [], [], userAccount3.address)

    await dappRegistry.connect(userAccount1).deleteRecord(createRecordHash(4))

    await checkUserRecords(dappRegistry.connect(userAccount1), [], [], [], userAccount1.address)

    const hashes = await dappRegistry.connect(userAccount1).getRecordSlice(0, 100)

    expect(hashes.length).equal(7)
  })

  it('Multiple users should be able to add new dApp records', async () => {
    const user1RecordHashes = [11, 12, 13]
    const user2RecordHashes = [14, 15, 16]
    const user3RecordHashes = [17, 18, 19]

    const userIndices = [0, 1, 2]

    await createUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes)
    await createUserRecords(dappRegistry.connect(userAccount2), user2RecordHashes)
    await createUserRecords(dappRegistry.connect(userAccount3), user3RecordHashes)

    await checkUserRecords(
      dappRegistry.connect(userAccount1),
      user1RecordHashes,
      [7, 8, 9],
      userIndices,
      userAccount1.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [10, 11, 12],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount3),
      user3RecordHashes,
      [13, 14, 15],
      userIndices,
      userAccount3.address,
    )

    await checkUser(dappRegistry.connect(userAccount1), user1RecordHashes, userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)
  })

  it("User who is not owner shouldn't be able to delete records", async () => {
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
    await dappRegistry.connect(userAccount1).deleteRecord(createRecordHash(11))

    // Before deleting the record with hash = 1 => recordList = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    // After deleting the record with hash = 1 => recordList = [9, 2, 3, 4, 5, 6, 7, 8]
    const user1RecordHashes = [12, 13]
    const user2RecordHashes = [14, 15, 16]
    let user3RecordHashes = [17, 18, 19]

    const userIndices = [0, 1, 2]

    await checkUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes, [8, 9], [1, 0], userAccount1.address)
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [10, 11, 12],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount3),
      user3RecordHashes,
      [13, 14, 15],
      userIndices,
      userAccount3.address,
    )

    // User 1 before deleting the record with hash = 1 => records = [1, 2, 3]
    // User 1 after deleting the record with hash = 1 => records = [3, 2]
    await checkUser(dappRegistry.connect(userAccount1), [13, 12], userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)

    // Before deleting the record with hash = 9 => recordList = [9, 2, 3, 4, 5, 6, 7, 8]
    // After deleting the record with hash = 9 => recordList = [8, 2, 3, 4, 5, 6, 7]
    await dappRegistry.connect(userAccount3).deleteRecord(createRecordHash(19))

    user3RecordHashes = [17, 18]

    await checkUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes, [8, 9], [1, 0], userAccount1.address)
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [10, 11, 12],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount3),
      user3RecordHashes,
      [13, 14],
      [0, 1],
      userAccount3.address,
    )

    // User 3 before deleting the record with hash = 9 => records = [7, 8, 9]
    // User 3 after deleting the record with hash = 9 => records = [7, 8]
    await checkUser(dappRegistry.connect(userAccount1), [13, 12], userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)
  })

  it('Should return correct record count', async () => {
    const count = await dappRegistry.getRecordCount()
    expect(count).equals(16)
  })

  it('Should fetch right records', async () => {
    const recordHashes = await dappRegistry.getRecordSlice(8, 3)

    expect(recordHashes.length).equals(3)
    ;[12, 13, 14].forEach((recordHash, index) => {
      expect(recordHashes[index]).equals(createRecordHash(recordHash))
    })

    const records = await dappRegistry.getRecords(recordHashes)

    records.forEach((record, index) => {
      expect(record[0]).equals(index < 2 ? userAccount1.address : userAccount2.address)
      expect(record[1]).equals(recordHashes[index])
    })
  })

  it('Should validate records', async () => {
    const validatorDappRegistry = dappRegistry.connect(validatorAccount)

    await validatorDappRegistry.validateRecord(createRecordHash(12))

    const validatedRecords = await validatorDappRegistry.getValidatedRecords(validatorAccount.address)

    expect(validatedRecords.length).equals(1)
    expect(validatedRecords[0][1]).equals(createRecordHash(12))
  })
})
