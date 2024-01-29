import { Contract, ContractRunner, JsonRpcProvider } from 'ethers'
import DataHubContractLocal from '../contracts/DataHub/DataHub.json'
import { DataHubEnvironment, Environments, EthAddress, HexString, SwarmLocation } from '../model'
import { DATA_HUB_ENVIRONMENT_CONFIGS, ENS_DOMAIN } from '../constants'
import { Username } from '../model/domain.type'
import { waitTransaction } from '../utils/tx'
import { ActiveBid, Category, SubItem, Subscription, SubscriptionRequest } from '../model/subscription.model'
import { namehash } from 'ethers'
import { UserStats } from '../model/user-stats.model'

export const DataHubContract = DataHubContractLocal

export class DataHub {
  private _provider: JsonRpcProvider
  private _dataHubContract: Contract

  constructor(
    config: DataHubEnvironment = DATA_HUB_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    contractRunner: ContractRunner | null = null,
    private domain = ENS_DOMAIN,
  ) {
    this._provider = new JsonRpcProvider(config.rpcUrl)

    this._dataHubContract = new Contract(config.dataHubAddress, DataHubContract.abi, this._provider)

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
    this._dataHubContract = this._dataHubContract.connect(contractRunner) as Contract
  }

  public createSubscription(
    ens: Username,
    location: SwarmLocation,
    price: bigint,
    categoryHash: HexString,
    podAddress: EthAddress,
    daysValid: number,
    value?: bigint,
  ): Promise<void> {
    return waitTransaction(
      this._dataHubContract.listSub(
        this.hashUsername(ens),
        location,
        price,
        categoryHash,
        podAddress,
        daysValid,
        { value },
      ),
    )
  }

  public async getUsersSubscriptions(address: EthAddress): Promise<Subscription[]> {
    const subscriptionIds: HexString[] = await this._dataHubContract.getListedSubs(address)

    const subscriptions: Subscription[] = []

    await subscriptionIds.reduce(async (prevRequest, subscriptionId) => {
      await prevRequest

      const subscription = await this._dataHubContract.getSubBy(subscriptionId)

      subscriptions.push(subscription)
    }, Promise.resolve())

    return subscriptions
  }

  public requestSubscription(subHash: HexString, buyerUsername: string, price: bigint): Promise<void> {
    return waitTransaction(
      this._dataHubContract.bidSub(subHash, this.hashUsername(buyerUsername), { value: price }),
    )
  }

  public requestSubscriptionAgain(requestHash: HexString, price: bigint): Promise<void> {
    return waitTransaction(this._dataHubContract.requestAgain(requestHash, { value: price }))
  }

  public removeUserActiveBid(requestHash: HexString): Promise<void> {
    return waitTransaction(this._dataHubContract.removeUserActiveBid(requestHash))
  }

  public sellSubscription(requestHash: HexString, encryptedKeyLocation: HexString): Promise<void> {
    return waitTransaction(this._dataHubContract.sellSub(requestHash, encryptedKeyLocation))
  }

  public getUserStats(address: EthAddress): Promise<UserStats> {
    return this._dataHubContract.getUserStats(address)
  }

  public setPortableAddress(address: EthAddress): Promise<void> {
    return waitTransaction(this._dataHubContract.setPortableAddress(address))
  }

  public getPortableAddress(address: EthAddress): Promise<EthAddress> {
    return this._dataHubContract.getPortableAddress(address)
  }

  public getFee(fee: bigint, amount: bigint): Promise<bigint> {
    return this._dataHubContract.getFee(fee, amount)
  }

  public setFee(newFee: bigint): Promise<void> {
    return waitTransaction(this._dataHubContract.setFee(newFee))
  }

  public setListingFee(newListingFee: bigint): Promise<void> {
    return waitTransaction(this._dataHubContract.setListingFee(newListingFee))
  }

  public getCategory(category: HexString): Promise<Category> {
    return this._dataHubContract.getCategory(category)
  }

  public getSubs(): Promise<Subscription[]> {
    return this._dataHubContract.getSubs()
  }

  public getSubByIndex(index: bigint): Promise<Subscription> {
    return this._dataHubContract.getSubByIndex(index)
  }

  public getSubBy(subHash: HexString): Promise<Subscription> {
    return this._dataHubContract.getSubBy(subHash)
  }

  public getSubRequestAt(address: EthAddress, index: bigint): Promise<SubscriptionRequest> {
    return this._dataHubContract.getSubRequestAt(address, index)
  }

  public getActiveBidAt(address: EthAddress, index: bigint): Promise<ActiveBid> {
    return this._dataHubContract.getActiveBidAt(address, index)
  }

  public getAllSubItems(address: EthAddress): Promise<SubItem[]> {
    return this._dataHubContract.getAllSubItems(address)
  }

  public getAllSubItemsForNameHash(nameHash: HexString): Promise<SubItem[]> {
    return this._dataHubContract.getAllSubItemsForNameHash(nameHash)
  }

  public getNameHashSubItems(nameHash: HexString): Promise<HexString[]> {
    return this._dataHubContract.getNameHashSubItems(nameHash)
  }

  public getListedSubs(address: EthAddress): Promise<HexString[]> {
    return this._dataHubContract.getListedSubs(address)
  }

  public getActiveBids(address: EthAddress): Promise<ActiveBid[]> {
    return this._dataHubContract.getActiveBids(address)
  }

  public getSubRequestByHash(address: EthAddress, requestHash: HexString): Promise<SubscriptionRequest> {
    return this._dataHubContract.getSubRequestByHash(address, requestHash)
  }

  public getActiveBidsByHash(address: EthAddress, requestHash: HexString): Promise<ActiveBid[]> {
    return this._dataHubContract.getActiveBidsByHash(address, requestHash)
  }

  public getSubRequests(address: EthAddress): Promise<SubscriptionRequest[]> {
    return this._dataHubContract.getSubRequests(address)
  }

  public getSubSubscribers(subHash: HexString): Promise<EthAddress[]> {
    return this._dataHubContract.getSubSubscribers(subHash)
  }

  public getSubInfoBalance(subHash: HexString, address: EthAddress): Promise<bigint> {
    return this._dataHubContract.getSubInfoBalance(subHash, address)
  }

  public enableSub(subHash: HexString, active: boolean): Promise<void> {
    return waitTransaction(this._dataHubContract.enableSub(subHash, active))
  }

  public reportSub(subHash: HexString): Promise<void> {
    return waitTransaction(this._dataHubContract.reportSub(subHash))
  }

  private hashUsername(username: Username): string {
    return namehash(`${username}.${this.domain}`)
  }
}
