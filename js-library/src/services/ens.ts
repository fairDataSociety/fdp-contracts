import { utils, Contract, Signer, providers, BigNumber } from 'ethers'
import { ENS_DOMAIN, NULL_ADDRESS } from '../constants/constants'
import { ENS_ENVIRONMENT_CONFIGS } from '../constants/environment'
import { waitRequestTransaction } from '../utils/tx'
import { joinPublicKey, isPublicKeyValid, splitPublicKey } from '../utils/keys'
import { Environments } from '../model/environments.enum'
import { EnsUserData } from '../model/ens-user-data.model'
import { EthAddress, PublicKey } from '../model/hex.types'
import { EnsEnvironment } from '../model/environment.model'
import ENSRegistryContractLocal from '../contracts/ENSRegistry/ENSRegistry.json'
import PublicResolverContractLocal from '../contracts/PublicResolver/PublicResolver.json'
import FDSRegistrarContractLocal from '../contracts/FDSRegistrar/FDSRegistrar.json'
import { Username } from '../model/domain.type'
import { assertUsername } from '../utils/domains'
import { extractMessageFromFailedTx, isTxError } from '../utils/blockchain'
import { ServiceRequest } from '../model/service-request.model'

const { keccak256, toUtf8Bytes, namehash } = utils

export type SignerOrProvider = string | providers.Provider | Signer

export const ENSRegistryContract = ENSRegistryContractLocal
export const PublicResolverContract = PublicResolverContractLocal
export const FDSRegistrarContract = FDSRegistrarContractLocal

enum RegisterUsernameStage {
  FDS_REGISTER_COMPLETED = 1,
  SET_RESOLVER_COMPLETED = 2,
  SET_PUBLIC_KEY_COMPLETED = 3,
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
  private _provider: providers.JsonRpcProvider
  private _ensRegistryContract: Contract
  private _fdsRegistrarContract: Contract
  private _publicResolverContract: Contract

  constructor(
    private config: EnsEnvironment = ENS_ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
    signerOrProvider: SignerOrProvider | null = null,
    private domain = ENS_DOMAIN,
  ) {
    this._provider = new providers.JsonRpcProvider(config.rpcUrl)

    const { ensRegistry, fdsRegistrar, publicResolver } = config.contractAddresses

    this._ensRegistryContract = new Contract(ensRegistry, ENSRegistryContract.abi, this._provider)
    this._publicResolverContract = new Contract(publicResolver, PublicResolverContract.abi, this._provider)
    this._fdsRegistrarContract = new Contract(fdsRegistrar, FDSRegistrarContract.abi, this._provider)

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
   * Connects signer to the smart contracts
   * @param signerOrProvider An instance of ethers.js Wallet or any other signer
   */
  public connect(signerOrProvider: SignerOrProvider) {
    this._publicResolverContract = this._publicResolverContract.connect(signerOrProvider)
    this._fdsRegistrarContract = this._fdsRegistrarContract.connect(signerOrProvider)
    this._ensRegistryContract = this._ensRegistryContract.connect(signerOrProvider)
  }

  /**
   * Returns owner address of the provided username on ENS
   * @param username ENS username
   * @returns owner's address
   */
  public async getUsernameOwner(username: Username): Promise<EthAddress> {
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
   * @returns ServiceRequest instance that can be used to invoke the request multiple times if fails.
   */
  public createRegisterUsernameRequest(
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
    expires: number = 86400,
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
        await this.setPublicKey(registerRequest, username, publicKey)

        registerRequest.stage = RegisterUsernameStage.SET_PUBLIC_KEY_COMPLETED
      }
    } catch (error) {
      if (isTxError(error)) {
        throw new Error(extractMessageFromFailedTx(error))
      }
      throw error
    }
  }

  /**
   * Estimates gas amount for the registerUsername method
   * @param username ENS username
   * @param address Owner address of the username
   * @param publicKey Hex string of a public key
   * @param customRpc (optional) custom RPC provider if the default one can't calculate gas
   * @returns gas amount estimation
   */
  public async registerUsernameEstimateGas(
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
    expires: number = 86400,
    customRpc?: providers.JsonRpcProvider,
  ): Promise<BigNumber> {
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
        to: this._fdsRegistrarContract.address,
        data: encodedRegisterFn,
      }),
      rpc.estimateGas({
        to: this._ensRegistryContract.address,
        data: encodedSetResolverFn,
      }),
      rpc.estimateGas({
        to: this._publicResolverContract.address,
        data: encodedSetPubkeyFn,
      }),
    ])

    return gasAmounts.reduce((sum, amount) => sum.add(amount), BigNumber.from(0))
  }

  /**
   * Returns public key of registered username
   * @param username
   * @returns public key
   */
  public async getPublicKey(username: Username): Promise<PublicKey> {
    assertUsername(username)

    const [publicKeyX, publicKeyY] = await this._publicResolverContract.pubkey(this.hashUsername(username))

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

  /**
   * Sets user's public key to the user's ENS entry
   * @param request object previously created by the createRegisterUsernameRequest method
   * @param username ENS username
   * @param publicKey Public key that will be added to ENS
   */
  public setPublicKey(
    request: ServiceRequest<RegisterUsernameRequestData>,
    username: Username,
    publicKey: PublicKey,
  ): Promise<void> {
    assertUsername(username)
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)
    return waitRequestTransaction(this._provider, request, () =>
      this._publicResolverContract.setPubkey(this.hashUsername(username), publicKeyX, publicKeyY),
    )
  }

  private hashUsername(username: Username): string {
    return namehash(`${username}.${this.domain}`)
  }
}

export default ENS
