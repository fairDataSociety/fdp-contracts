import {
  Contract,
  JsonRpcProvider,
  keccak256,
  toUtf8Bytes,
  namehash,
  parseUnits,
  ContractRunner,
} from 'ethers'
import { ENS_DOMAIN, NULL_ADDRESS } from '../constants/constants'
import { ENS_ENVIRONMENT_CONFIGS } from '../constants/environment'
import { waitRequestTransaction } from '../utils/tx'
import {
  joinPublicKey,
  isPublicKeyValid,
  splitPublicKey,
  numberToBytes32,
  isZeroHexString,
} from '../utils/keys'
import { Environments } from '../model/environments.enum'
import { EnsUserData } from '../model/ens-user-data.model'
import { EthAddress, HexString, PublicKey } from '../model/hex.types'
import { EnsEnvironment } from '../model/environment.model'
import ENSRegistryContractLocal from '../contracts/ENSRegistry/ENSRegistry.json'
import PublicResolverContractLocal from '../contracts/PublicResolver/PublicResolver.json'
import FDSRegistrarContractLocal from '../contracts/FDSRegistrar/FDSRegistrar.json'
import FDSReverseRegistrarContractLocal from '../contracts/FDSReverseRegistrar/FDSReverseRegistrar.json'
import FDSNameResolverContractLocal from '../contracts/FDSNameResolver/FDSNameResolver.json'
import { Username } from '../model/domain.type'
import { assertUsername } from '../utils/domains'
import { extractMessageFromFailedTx, isTxError } from '../utils/blockchain'
import { ServiceRequest } from '../model/service-request.model'
import { hashAddress } from '../utils/address'

export const ENSRegistryContract = ENSRegistryContractLocal
export const PublicResolverContract = PublicResolverContractLocal
export const FDSRegistrarContract = FDSRegistrarContractLocal
export const FDSReverseRegistrarContract = FDSReverseRegistrarContractLocal
export const FDSNameResolverContract = FDSNameResolverContractLocal

enum RegisterUsernameStage {
  FDS_REGISTER_COMPLETED = 1,
  SET_RESOLVER_COMPLETED = 2,
  SET_PUBLIC_KEY_COMPLETED = 3,
  SET_NAME_COMPLETED = 4,
}

export interface RegisterUsernameRequestData {
  username: Username
  address: EthAddress
  publicKey: PublicKey
  expires: number
}

/**
 * ENS Class
 * Provides interface for interaction with the ENS smart contracts
 */
export class ENS {
  private _provider: JsonRpcProvider
  private _ensRegistryContract: Contract
  private _fdsRegistrarContract: Contract
  private _publicResolverContract: Contract
  private _reverseRegistrarContract: Contract
  private _nameResolverContract: Contract

  constructor(
    private config: EnsEnvironment = ENS_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    contractRunner: ContractRunner | null = null,
    private domain = ENS_DOMAIN,
  ) {
    this._provider = new JsonRpcProvider(config.rpcUrl)

    const { ensRegistry, fdsRegistrar, publicResolver, reverseResolver, nameResolver } =
      config.contractAddresses

    this._ensRegistryContract = new Contract(ensRegistry, ENSRegistryContract.abi, this._provider)
    this._publicResolverContract = new Contract(publicResolver, PublicResolverContract.abi, this._provider)
    this._fdsRegistrarContract = new Contract(fdsRegistrar, FDSRegistrarContract.abi, this._provider)
    this._reverseRegistrarContract = new Contract(
      reverseResolver,
      FDSReverseRegistrarContract.abi,
      this._provider,
    )
    this._nameResolverContract = new Contract(nameResolver, FDSNameResolverContract.abi, this._provider)

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
   * Connects signer to the smart contracts
   * @param contractRunner An instance of ethers.js Wallet or any other signer
   */
  public connect(contractRunner: ContractRunner | null) {
    this._publicResolverContract = this._publicResolverContract.connect(contractRunner) as Contract
    this._fdsRegistrarContract = this._fdsRegistrarContract.connect(contractRunner) as Contract
    this._ensRegistryContract = this._ensRegistryContract.connect(contractRunner) as Contract
    this._reverseRegistrarContract = this._reverseRegistrarContract.connect(contractRunner) as Contract
    this._nameResolverContract = this._nameResolverContract.connect(contractRunner) as Contract
  }

  /**
   * Returns owner address of the provided username on ENS
   * @param username ENS username
   * @returns owner's address
   */
  public getUsernameOwner(username: Username): Promise<EthAddress> {
    assertUsername(username)

    const usernameHash = this.hashUsername(username)

    return this._ensRegistryContract.owner(usernameHash)
  }

  /**
   * Checks whether username is available on ENS
   * @param username ENS username
   * @returns True if the username is available
   */
  public async isUsernameAvailable(username: Username): Promise<boolean> {
    assertUsername(username)
    const owner = await this.getUsernameOwner(username)

    return owner === NULL_ADDRESS
  }

  /**
   * Creates a request object that needs to be used to invoke the registerUsername method.
   * The request object can be used to invoke the method multiple times without making any
   * inconsistencies. This can be useful if registration fails because of insufficient funds,
   * or some other reason.
   * @param username ENS username
   * @param address Owner address of the username
   * @param publicKey Hex string of a public key
   * @param expires Time in seconds
   * @returns ServiceRequest instance that can be used to invoke the request multiple times if fails.
   */
  public createRegisterUsernameRequest(
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
    expires = 86400,
  ): ServiceRequest<RegisterUsernameRequestData> {
    return {
      stage: 0,
      data: {
        username,
        address,
        publicKey,
        expires,
      },
      completedTxs: [],
    }
  }

  /**
   * Sets owner of the provided username on ENS
   * @param registerRequest request object previously created by the createRegisterUsernameRequest method
   */
  public async registerUsername(registerRequest: ServiceRequest<RegisterUsernameRequestData>): Promise<void> {
    const {
      data: { username, address, publicKey, expires },
    } = registerRequest
    try {
      if (registerRequest.stage < RegisterUsernameStage.FDS_REGISTER_COMPLETED) {
        assertUsername(username)

        let ownerAddress: EthAddress = NULL_ADDRESS

        if (this.config.performChecks) {
          ownerAddress = await this.getUsernameOwner(username)

          if (ownerAddress !== NULL_ADDRESS) {
            throw new Error(`ENS: Username ${username} is not available`)
          }
        }

        if (ownerAddress === NULL_ADDRESS) {
          await waitRequestTransaction(this._provider, registerRequest, () =>
            this._fdsRegistrarContract.register(keccak256(toUtf8Bytes(username)), address, expires),
          )
        }

        registerRequest.stage = RegisterUsernameStage.FDS_REGISTER_COMPLETED
      }

      if (registerRequest.stage < RegisterUsernameStage.SET_RESOLVER_COMPLETED) {
        await waitRequestTransaction(this._provider, registerRequest, () =>
          this._ensRegistryContract.setResolver(
            this.hashUsername(username),
            this._publicResolverContract.address,
          ),
        )

        registerRequest.stage = RegisterUsernameStage.SET_RESOLVER_COMPLETED
      }

      if (registerRequest.stage < RegisterUsernameStage.SET_PUBLIC_KEY_COMPLETED) {
        await this.setNameAndPublicKey(registerRequest, username, address, publicKey)

        registerRequest.stage = RegisterUsernameStage.SET_PUBLIC_KEY_COMPLETED
      }

      if (registerRequest.stage < RegisterUsernameStage.SET_NAME_COMPLETED) {
        await waitRequestTransaction(this._provider, registerRequest, () =>
          this._reverseRegistrarContract.setName(username),
        )

        registerRequest.stage = RegisterUsernameStage.SET_NAME_COMPLETED
      }
    } catch (error) {
      if (isTxError(error)) {
        throw new Error(extractMessageFromFailedTx(error))
      }
      throw error
    }
  }

  /**
   * Retrieves the estimated gas usage for all methods involved in username registration
   * @returns {number} gas amount estimation
   */
  public registerUsernameApproximateGas(): number {
    return this.config.gasEstimation
  }

  /**
   * Calculates total price for username registration
   * @param priorityPrice an additional fee for the transaction, defaults to 1.5 gwei
   * @returns {bigint} approximate total price for transactions in wei
   */
  public async registerUsernameApproximatePrice(priorityPrice = parseUnits('1.5', 'gwei')): Promise<bigint> {
    const gas = this.registerUsernameApproximateGas()
    const { gasPrice } = await this._provider.getFeeData()

    if (!gasPrice) {
      throw new Error('Cannot estimate gas price')
    }

    return BigInt(gas) * gasPrice + priorityPrice
  }

  /**
   * Estimates gas amount for the registerUsername method
   * @param username ENS username
   * @param address Owner address of the username
   * @param publicKey Hex string of a public key
   * @param expires Time in seconds
   * @param customRpc (optional) custom RPC provider if the default one can't calculate gas
   * @returns gas amount estimation
   */
  public async registerUsernameEstimateGas(
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
    expires = 86400,
    customRpc?: JsonRpcProvider,
  ): Promise<bigint> {
    const rpc = customRpc || this._provider
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)

    const encodedRegisterFn = this._fdsRegistrarContract.interface.encodeFunctionData('register', [
      keccak256(toUtf8Bytes(username)),
      address,
      expires,
    ])

    const encodedSetResolverFn = this._ensRegistryContract.interface.encodeFunctionData('setResolver', [
      this.hashUsername(username),
      this._publicResolverContract.address,
    ])

    const encodedSetPubkeyFn = this._publicResolverContract.interface.encodeFunctionData('setPubkey', [
      this.hashUsername(username),
      publicKeyX,
      publicKeyY,
    ])

    const gasAmounts = await Promise.all([
      rpc.estimateGas({
        to: await this._fdsRegistrarContract.getAddress(),
        data: encodedRegisterFn,
      }),
      rpc.estimateGas({
        to: await this._ensRegistryContract.getAddress(),
        data: encodedSetResolverFn,
      }),
      rpc.estimateGas({
        to: await this._publicResolverContract.getAddress(),
        data: encodedSetPubkeyFn,
      }),
    ])

    return gasAmounts.reduce((sum, amount) => sum + amount, BigInt(0))
  }

  /**
   * Returns public key of registered username
   * @param username
   * @returns public key
   */
  public async getPublicKey(username: Username): Promise<PublicKey> {
    assertUsername(username)

    return this.getPublicKeyByUsernameHash(this.hashUsername(username))
  }

  /**
   * Returns public key of registered username
   * @param usernameHash
   * @returns public key
   */
  public async getPublicKeyByUsernameHash(usernameHash: HexString): Promise<PublicKey> {
    const [publicKeyX, publicKeyY] = await this._publicResolverContract.pubkey(usernameHash)

    const publicKey = joinPublicKey(publicKeyX, publicKeyY)

    if (!isPublicKeyValid(publicKey)) {
      throw new Error('Public key is not set or is invalid')
    }

    return publicKey
  }

  /**
   * Fetches all ENS data related to the provided username
   * @param username ENS username
   * @returns All user's data stored on ENS
   */
  public getUserData(username: Username): Promise<EnsUserData> {
    assertUsername(username)

    return this._publicResolverContract.getAll(this.hashUsername(username))
  }

  public async getUsernameByAddress(address: EthAddress): Promise<Username> {
    const hash = await this._nameResolverContract.name(hashAddress(address))

    if (!hash || isZeroHexString(hash)) {
      throw new Error('Address is not available in reverse registrar.')
    }

    return this._publicResolverContract.name(hash)
  }

  /**
   * Sets user's public key to the user's ENS entry
   * @param request object previously created by the createRegisterUsernameRequest method
   * @param username ENS username
   * @param publicKey Public key that will be added to ENS
   */
  public setNameAndPublicKey(
    request: ServiceRequest<RegisterUsernameRequestData>,
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
  ): Promise<void> {
    assertUsername(username)
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)

    return waitRequestTransaction(this._provider, request, () =>
      this._publicResolverContract.setAll(
        this.hashUsername(username),
        address,
        numberToBytes32(BigInt(0)),
        numberToBytes32(BigInt(0)),
        publicKeyX,
        publicKeyY,
        username,
      ),
    )
  }

  private hashUsername(username: Username): string {
    return namehash(`${username}.${this.domain}`)
  }
}

export default ENS
