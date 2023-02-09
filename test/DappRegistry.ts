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

  function createUserRecords(userDappRegistry: DappRegistry, recordHashes: number[]) {
    return Promise.all(
      recordHashes.map(recordHash => {
        const hash = createRecordHash(recordHash)
        const urlHash = createRecordHash(recordHash << 8)
        return userDappRegistry.craeteRecord(hash, urlHash)
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
        const record = await userDappRegistry.getRecord(recordHash)

        expect(record[0]).equal(address) // address
        expect(record[1]).equal(recordHash) // location
        expect(record[2]).equal(recordHash << 8) // urlHash
        expect(record[3]).equal(indices[index]) // index
        expect(record[4]).equal(userIndices[index]) // creatorIndex
      }),
    )
  }

  async function checkUser(userDappRegistry: DappRegistry, recordHashes: number[], address: string) {
    const user = await userDappRegistry.getUser(address)

    user.records.forEach((hash, index) => expect(hash).equal(recordHashes[index]))
  }

  it('Should add new dApp records', async () => {
    const user1RecordHashes = [1, 2, 3]
    const user2RecordHashes = [4, 5, 6]
    const user3RecordHashes = [7, 8, 9]

    const userIndices = [0, 1, 2]

    await createUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes)
    await createUserRecords(dappRegistry.connect(userAccount2), user2RecordHashes)
    await createUserRecords(dappRegistry.connect(userAccount3), user3RecordHashes)

    await checkUserRecords(
      dappRegistry.connect(userAccount1),
      user1RecordHashes,
      [0, 1, 2],
      userIndices,
      userAccount1.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [3, 4, 5],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount3),
      user3RecordHashes,
      [6, 7, 8],
      userIndices,
      userAccount3.address,
    )

    await checkUser(dappRegistry.connect(userAccount1), user1RecordHashes, userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)
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
    await dappRegistry.connect(userAccount1).deleteRecord(createRecordHash(1))

    // Before deleting the record with hash = 1 => recordList = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    // After deleting the record with hash = 1 => recordList = [9, 2, 3, 4, 5, 6, 7, 8]
    const user1RecordHashes = [2, 3]
    const user2RecordHashes = [4, 5, 6]
    let user3RecordHashes = [7, 8, 9]

    const userIndices = [0, 1, 2]

    await checkUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes, [1, 2], [1, 0], userAccount1.address)
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [3, 4, 5],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(
      dappRegistry.connect(userAccount3),
      user3RecordHashes,
      [6, 7, 0],
      userIndices,
      userAccount3.address,
    )

    // User 1 before deleting the record with hash = 1 => records = [1, 2, 3]
    // User 1 after deleting the record with hash = 1 => records = [3, 2]
    await checkUser(dappRegistry.connect(userAccount1), [3, 2], userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)

    // Before deleting the record with hash = 9 => recordList = [9, 2, 3, 4, 5, 6, 7, 8]
    // After deleting the record with hash = 9 => recordList = [8, 2, 3, 4, 5, 6, 7]
    await dappRegistry.connect(userAccount3).deleteRecord(createRecordHash(9))

    user3RecordHashes = [7, 8]

    await checkUserRecords(dappRegistry.connect(userAccount1), user1RecordHashes, [1, 2], [1, 0], userAccount1.address)
    await checkUserRecords(
      dappRegistry.connect(userAccount2),
      user2RecordHashes,
      [3, 4, 5],
      userIndices,
      userAccount2.address,
    )
    await checkUserRecords(dappRegistry.connect(userAccount3), user3RecordHashes, [6, 0], [0, 1], userAccount3.address)

    // User 3 before deleting the record with hash = 9 => records = [7, 8, 9]
    // User 3 after deleting the record with hash = 9 => records = [7, 8]
    await checkUser(dappRegistry.connect(userAccount1), [3, 2], userAccount1.address)
    await checkUser(dappRegistry.connect(userAccount2), user2RecordHashes, userAccount2.address)
    await checkUser(dappRegistry.connect(userAccount3), user3RecordHashes, userAccount3.address)
  })
})
