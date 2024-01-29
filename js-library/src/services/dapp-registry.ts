import {
  Contract,
  JsonRpcProvider,
  zeroPadValue,
  keccak256,
  toBeHex,
  toUtf8Bytes,
  ContractRunner,
} from 'ethers'
import { DAPP_REGISTRY_ENVIRONMENT_CONFIGS } from '../constants'
import DappRegistryContractLocal from '../contracts/DappRegistry/DappRegistry.json'
import RatingsContractLocal from '../contracts/Ratings/Ratings.json'
import {
  DappRegistryEnvironment,
  Environments,
  EthAddress,
  HexString,
  RecordHash,
  SwarmLocation,
} from '../model'
import { DappRecord } from '../model/dapp-record.model'
import { waitTransaction } from '../utils/tx'
import { Rating } from '../model/rating.model'

export const DappRegistryContract = DappRegistryContractLocal
export const RatingsContract = RatingsContractLocal

const ADMIN_ROLE = zeroPadValue(toBeHex(0), 32)
const VALIDATOR_ROLE = keccak256(toUtf8Bytes('VALIDATOR_ROLE'))

/**
 * DappRegistry Class
 * Provides interface for interaction with the DappRegistry smart contracts
 */
export class DappRegistry {
  private _provider: JsonRpcProvider
  private _dappRegistryContract: Contract
  private _ratingsContract: Contract

  constructor(
    config: DappRegistryEnvironment = DAPP_REGISTRY_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    contractRunner: ContractRunner | null = null,
  ) {
    this._provider = new JsonRpcProvider(config.rpcUrl)

    this._dappRegistryContract = new Contract(
      config.dappRegistryAddress,
      DappRegistryContract.abi,
      this._provider,
    )

    this._ratingsContract = new Contract(config.ratingsAddress, RatingsContract.abi, this._provider)

    if (contractRunner) {
      this.connect(contractRunner)
    }
  }

  /**
   * returns RPC provider
   */
  public get provider(): JsonRpcProvider {
    return this._provider
  }

  /**
   * Connects signer to the smart contract
   * @param contractRunner An instance of ethers.js ContractRunner
   */
  public connect(contractRunner: ContractRunner | null): void {
    this._dappRegistryContract = this._dappRegistryContract.connect(contractRunner) as Contract
    this._ratingsContract = this._ratingsContract.connect(contractRunner) as Contract
  }

  public grantAdminRole(address: EthAddress): Promise<void> {
    return waitTransaction(this._dappRegistryContract.grantRole(ADMIN_ROLE, address))
  }

  public isAdmin(address: EthAddress): Promise<boolean> {
    return this._dappRegistryContract.hasRole(ADMIN_ROLE, address)
  }

  public revokeAdminRole(address: EthAddress): Promise<void> {
    return waitTransaction(this._dappRegistryContract.revokeRole(ADMIN_ROLE, address))
  }

  public grantValidatorRole(address: EthAddress): Promise<void> {
    return waitTransaction(this._dappRegistryContract.grantRole(VALIDATOR_ROLE, address))
  }

  public isValidator(address: EthAddress): Promise<boolean> {
    return this._dappRegistryContract.hasRole(VALIDATOR_ROLE, address)
  }

  public revokeValidatorRole(address: EthAddress): Promise<void> {
    return waitTransaction(this._dappRegistryContract.revokeRole(VALIDATOR_ROLE, address))
  }

  public createRecord(location: SwarmLocation, urlHash: HexString): Promise<void> {
    return waitTransaction(this._dappRegistryContract.createRecord(location, urlHash))
  }

  public editRecord(recordHash: RecordHash, newLocation: SwarmLocation): Promise<void> {
    return waitTransaction(this._dappRegistryContract.editRecord(recordHash, newLocation))
  }

  public validateRecord(recordHash: RecordHash): Promise<void> {
    return waitTransaction(this._dappRegistryContract.validateRecord(recordHash))
  }

  public unvalidateRecord(recordHash: RecordHash): Promise<void> {
    return waitTransaction(this._dappRegistryContract.unvalidateRecord(recordHash))
  }

  public getValidatedRecords(address: EthAddress): Promise<DappRecord[]> {
    return this._dappRegistryContract.getValidatedRecords(address)
  }

  public getRecordCount(): Promise<bigint> {
    return this._dappRegistryContract.getRecordCount()
  }

  public getRecordSlice(start: bigint, length: bigint): Promise<RecordHash[]> {
    return this._dappRegistryContract.getRecordSlice(start, length)
  }

  public async getRecord(recordHash: RecordHash): Promise<DappRecord> {
    const record = await this._dappRegistryContract.getRecord(recordHash)

    return this.convertDappRecord(record)
  }

  public async getRecords(recordHashes: RecordHash[]): Promise<DappRecord[]> {
    const records: Array<Array<string>> = await this._dappRegistryContract.getRecords(recordHashes)

    return records.map(record => this.convertDappRecord(record))
  }

  public async getUserRecordHashes(address: EthAddress): Promise<RecordHash[]> {
    return this._dappRegistryContract.getUserRecordHashes(address)
  }

  public rateDapp(recordLocation: SwarmLocation, review: HexString, rating: number): Promise<void> {
    return waitTransaction(this._ratingsContract.rate(recordLocation, review, rating))
  }

  public async getAverageRating(recordLocation: SwarmLocation): Promise<number> {
    const averageRating = Number(await this._ratingsContract.getAverageRating(recordLocation))

    return Number.isInteger(averageRating) ? averageRating : 0
  }

  public async getNumberOfRatings(recordLocation: SwarmLocation): Promise<bigint> {
    return this._ratingsContract.getNumberOfRatings(recordLocation)
  }

  public async hasUserRated(recordLocation: SwarmLocation): Promise<boolean> {
    return Boolean(await this._ratingsContract.hasUserRated(recordLocation))
  }

  public async getRatingFor(recordLocation: SwarmLocation): Promise<Rating[]> {
    const records = await this._ratingsContract.getRatingFor(recordLocation)

    return records.map((record: string[]) => this.convertRatingRecord(record))
  }

  private convertDappRecord(record: Array<unknown>): DappRecord {
    let timestamp: Date = new Date('')

    try {
      timestamp = new Date(Number(record[7] as bigint))
    } catch (error) {}

    return {
      recordHash: record[0] as string,
      creator: record[1] as string,
      location: record[2] as string,
      urlHash: record[3] as string,
      edited: Boolean(record[4]),
      index: record[5] as bigint,
      creatorIndex: record[6] as bigint,
      timestamp,
    }
  }

  private convertRatingRecord(record: Array<string>): Rating {
    return {
      rating: Number(record[0]),
      review: record[1],
      user: record[2],
    }
  }
}
