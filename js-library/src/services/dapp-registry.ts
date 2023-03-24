import { utils, Contract, providers, BigNumber } from 'ethers'
import { DAPP_REGISTRY_ENVIRONMENT_CONFIGS } from '../constants'
import DappRegistryContractLocal from '../contracts/DappRegistry/DappRegistry.json'
import { DappRegistryEnvironment, Environments, EthAddress, HexString, SwarmLocation } from '../model'
import { DappRecord } from '../model/dapp-record.model'
import { DappUser } from '../model/dapp-user.model'
import { waitTransaction } from '../utils/tx'
import { SignerOrProvider } from './ens'

export const DappRegistryContract = DappRegistryContractLocal

const ADMIN_ROLE = utils.hexZeroPad(utils.hexlify(0), 32)
const VALIDATOR_ROLE = utils.keccak256(utils.toUtf8Bytes('VALIDATOR_ROLE'))

/**
 * DappRegistry Class
 * Provides interface for interaction with the DappRegistry smart contracts
 */
export class DappRegistry {
  private _provider: providers.JsonRpcProvider
  private _dappRegistryContract: Contract

  constructor(
    config: DappRegistryEnvironment = DAPP_REGISTRY_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    signerOrProvider: SignerOrProvider | null = null,
  ) {
    this._provider = new providers.JsonRpcProvider(config.rpcUrl)

    this._dappRegistryContract = new Contract(
      config.contractAddress,
      DappRegistryContract.abi,
      this._provider,
    )

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

  public deleteRecord(location: SwarmLocation): Promise<void> {
    return waitTransaction(this._dappRegistryContract.deleteRecord(location))
  }

  public validateRecord(location: SwarmLocation): Promise<void> {
    return waitTransaction(this._dappRegistryContract.validateRecord(location))
  }

  public unvalidateRecord(location: SwarmLocation): Promise<void> {
    return waitTransaction(this._dappRegistryContract.unvalidateRecord(location))
  }

  public getValidatedRecords(address: EthAddress): Promise<DappRecord[]> {
    return this._dappRegistryContract.getValidatedRecords(address)
  }

  public getRecordCount(): Promise<BigNumber> {
    return this._dappRegistryContract.getRecordCount()
  }

  public getRecordSlice(start: BigNumber, length: BigNumber): Promise<SwarmLocation[]> {
    return this._dappRegistryContract.getRecordSlice(start, length)
  }

  public async getRecord(location: SwarmLocation): Promise<DappRecord> {
    const record = await this._dappRegistryContract.getRecord(location)

    return this.convertDappRecord(record)
  }

  public async getRecords(locations: SwarmLocation[]): Promise<DappRecord[]> {
    const records: Array<Array<string>> = await this._dappRegistryContract.getRecords(locations)

    return records.map(record => this.convertDappRecord(record))
  }

  public async getUser(address: EthAddress): Promise<DappUser> {
    const user = await this._dappRegistryContract.getUser(address)

    return {
      records: user[0],
      validatedRecords: user[1],
    }
  }

  private convertDappRecord(record: Array<string>): DappRecord {
    return {
      creator: record[0],
      location: record[1],
      urlHash: record[2],
      index: BigNumber.from(record[3]),
      creatorIndex: BigNumber.from(record[4]),
      timestamp: new Date(record[5]),
    }
  }
}
