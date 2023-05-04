import { utils, Contract, providers, BigNumber } from 'ethers'
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
import { SignerOrProvider } from './ens'
import { Rating } from '../model/rating.model'

export const DappRegistryContract = DappRegistryContractLocal
export const RatingsContract = RatingsContractLocal

const ADMIN_ROLE = utils.hexZeroPad(utils.hexlify(0), 32)
const VALIDATOR_ROLE = utils.keccak256(utils.toUtf8Bytes('VALIDATOR_ROLE'))

/**
 * DappRegistry Class
 * Provides interface for interaction with the DappRegistry smart contracts
 */
export class DappRegistry {
  private _provider: providers.JsonRpcProvider
  private _dappRegistryContract: Contract
  private _ratingsContract: Contract

  constructor(
    config: DappRegistryEnvironment = DAPP_REGISTRY_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    signerOrProvider: SignerOrProvider | null = null,
  ) {
    this._provider = new providers.JsonRpcProvider(config.rpcUrl)

    this._dappRegistryContract = new Contract(
      config.dappRegistryAddress,
      DappRegistryContract.abi,
      this._provider,
    )

    this._ratingsContract = new Contract(config.ratingsAddress, RatingsContract.abi, this._provider)

    if (signerOrProvider) {
      this.connect(signerOrProvider)
    }
  }

  /**
   * returns RPC provider
   */
  public get provider(): providers.JsonRpcProvider {
    return this._provider
  }

  /**
   * Connects signer to the smart contract
   * @param signerOrProvider An instance of ethers.js Wallet or any other signer
   */
  public connect(signerOrProvider: SignerOrProvider): void {
    this._dappRegistryContract = this._dappRegistryContract.connect(signerOrProvider)
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

  public getRecordCount(): Promise<BigNumber> {
    return this._dappRegistryContract.getRecordCount()
  }

  public getRecordSlice(start: BigNumber, length: BigNumber): Promise<RecordHash[]> {
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
    return this._dappRegistryContract.getUser(address)
  }

  public rateDapp(recordLocation: SwarmLocation, review: HexString, rating: number): Promise<void> {
    return this._ratingsContract.rate(recordLocation, review, rating)
  }

  public getAverageRating(recordLocation: SwarmLocation): Promise<number> {
    return this._ratingsContract.getAverageRating(recordLocation)
  }

  public getNumberOfRatings(recordLocation: SwarmLocation): Promise<number> {
    return this._ratingsContract.getAverageRating(recordLocation)
  }

  public async hasUserRated(recordLocation: SwarmLocation): Promise<boolean> {
    return Boolean(await this._ratingsContract.hasUserRated(recordLocation))
  }

  public async getRatingFor(recordLocation: SwarmLocation): Promise<Rating[]> {
    const records = await this._ratingsContract.getRatingFor(recordLocation)

    return records.map((record: string[]) => this.convertRatingRecord(record))
  }

  private convertDappRecord(record: Array<string>): DappRecord {
    return {
      recordHash: record[0],
      creator: record[1],
      location: record[2],
      urlHash: record[3],
      edited: Boolean(record[4]),
      index: BigNumber.from(record[5]),
      creatorIndex: BigNumber.from(record[6]),
      timestamp: new Date(record[7]),
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
