import { utils, Contract, Signer, providers, BigNumber } from 'ethers'
import { ENS_DOMAIN, NULL_ADDRESS } from '../constants/constants'
import { ENVIRONMENT_CONFIGS } from '../constants/environment'
import { waitTransaction } from '../utils/tx'
import { joinPublicKey, isPublicKeyValid, splitPublicKey } from '../utils/keys'
import { Environments } from '../model/environments.enum'
import { EnsUserData } from '../model/ens-user-data.model'
import { EthAddress, PublicKey } from '../model/hex.types'
import { Environment } from '../model/environment.model'
import ENSRegistryContractLocal from '../contracts/ENSRegistry/ENSRegistry.json'
import PublicResolverContractLocal from '../contracts/PublicResolver/PublicResolver.json'
import FDSRegistrarContractLocal from '../contracts/FDSRegistrar/FDSRegistrar.json'
import { Username } from '../model/domain.type'
import { assertUsername } from '../utils/domains'
import { checkMinBalance, extractMessageFromFailedTx, isTxError } from '../utils/blockchain'

const { keccak256, toUtf8Bytes, namehash } = utils

export type SignerOrProvider = string | providers.Provider | Signer

export const ENSRegistryContract = ENSRegistryContractLocal
export const PublicResolverContract = PublicResolverContractLocal
export const FDSRegistrarContract = FDSRegistrarContractLocal

const MIN_BALANCE = BigNumber.from('10000000000000000')

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
    private config: Environment = ENVIRONMENT_CONFIGS[Environments.LOCALHOST],
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
   * Sets owner of the provided username on ENS
   * @param username ENS username
   * @param address Owner address of the username
   * @param publicKey Hex string of a public key
   */
  public async registerUsername(
    username: Username,
    address: EthAddress,
    publicKey: PublicKey,
    expires: number = 86400,
  ): Promise<void> {
    try {
      assertUsername(username)

      let ownerAddress: EthAddress = NULL_ADDRESS

      if (this.config.performChecks) {
        await checkMinBalance(this.provider, address, MIN_BALANCE)

        ownerAddress = await this.getUsernameOwner(username)

        if (ownerAddress !== NULL_ADDRESS && ownerAddress !== address) {
          throw new Error(`ENS: Username ${username} is not available`)
        }
      }

      if (ownerAddress === NULL_ADDRESS) {
        await waitTransaction(
          this._fdsRegistrarContract.register(keccak256(toUtf8Bytes(username)), address, expires, {
            gasLimit: '20000',
            gasPrice: '200000000000',
          }),
        )
      }

      await waitTransaction(
        this._ensRegistryContract.setResolver(
          this.hashUsername(username),
          this._publicResolverContract.address,
        ),
      )

      await this.setPublicKey(username, publicKey)
    } catch (error) {
      console.error(error)
      if (isTxError(error)) {
        throw new Error(extractMessageFromFailedTx(error))
      }
      throw error
    }
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
   * @param username ENS username
   * @param publicKey Public key that will be added to ENS
   */
  public setPublicKey(username: Username, publicKey: PublicKey): Promise<void> {
    assertUsername(username)
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)
    return waitTransaction(
      this._publicResolverContract.setPubkey(this.hashUsername(username), publicKeyX, publicKeyY),
    )
  }

  private hashUsername(username: Username): string {
    return namehash(`${username}.${this.domain}`)
  }
}

export default ENS
