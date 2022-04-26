import { utils, Contract, Signer, providers } from 'ethers'
import { ENS_DOMAIN, NULL_ADDRESS } from '../constants/constants'
import { ENVIRONMENT_RPC_URLS, CONTRACTS_METADATA } from '../constants/environment'
import { waitTransaction } from '../utils/tx'
import { joinPublicKey, isPublicKeyValid, splitPublicKey } from '../utils/keys'
import { Environment } from '../model/environment.enum'
import { EnsUserData } from '../model/ens-user-data.model'

const { keccak256, toUtf8Bytes, namehash } = utils

/**
 * Contract addresses
 */
export const ENS_REGISTRY_ADDRESS = process.env.ENS_REGISTRY_ADDRESS
export const PUBLIC_RESOLVER_ADDRESS = process.env.PUBLIC_RESOLVER_ADDRESS
export const SUBDOMAIN_REGISTRAR_ADDRESS = process.env.SUBDOMAIN_REGISTRAR_ADDRESS

type SignerOrProvider = string | providers.Provider | Signer

/**
 * ENS Class
 * Provides interface for interaction with the ENS smart contracts
 */
export class ENS {
  private _provider: providers.JsonRpcProvider
  private _ensRegistryContract: Contract
  private _subdomainRegistrarContract: Contract
  private _publicResolverContract: Contract

  constructor(
    environment: Environment = Environment.LOCALHOST,
    private domain = ENS_DOMAIN,
    signerOrProvider: SignerOrProvider | null = null,
  ) {
    this._provider = new providers.JsonRpcProvider(ENVIRONMENT_RPC_URLS[environment])

    const { ENSRegistryContract, PublicResolverContract, SubdomainRegistrarContract } =
      CONTRACTS_METADATA[environment]

    this._ensRegistryContract = new Contract(
      ENS_REGISTRY_ADDRESS as string,
      ENSRegistryContract.abi,
      this._provider,
    )
    this._publicResolverContract = new Contract(
      PUBLIC_RESOLVER_ADDRESS as string,
      PublicResolverContract.abi,
      this._provider,
    )
    this._subdomainRegistrarContract = new Contract(
      SUBDOMAIN_REGISTRAR_ADDRESS as string,
      SubdomainRegistrarContract.abi,
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
   * Connects signer to the smart contracts
   * @param signerOrProvider An instance of ethers.js Wallet or any other signer
   */
  public connect(signerOrProvider: SignerOrProvider) {
    this._publicResolverContract = this._publicResolverContract.connect(signerOrProvider)
    this._subdomainRegistrarContract = this._subdomainRegistrarContract.connect(signerOrProvider)
    this._ensRegistryContract = this._ensRegistryContract.connect(signerOrProvider)
  }

  /**
   * Returns owner address of the provided username on ENS
   * @param username ENS username
   * @returns owner's address
   */
  public async getUsernameOwner(username: string): Promise<string> {
    const usernameHash = this.hashUsername(username)

    return this._ensRegistryContract.owner(usernameHash)
  }

  /**
   * Checks whether username is available on ENS
   * @param username ENS username
   * @returns True if the username is available
   */
  public async isUsernameAvailable(username: string): Promise<boolean> {
    const owner = await this.getUsernameOwner(username)
    return owner === NULL_ADDRESS
  }

  /**
   * Sets owner of the provided username on ENS
   * @param username ENS username
   * @param address Owner address of the username
   */
  public async registerUsername(username: string, address: string, publicKey: string): Promise<void> {
    const ownerAddress = await this.getUsernameOwner(username)

    if (ownerAddress !== NULL_ADDRESS && ownerAddress !== address) {
      throw new Error(`ENS: Username ${username} is not available`)
    }

    if (ownerAddress === NULL_ADDRESS) {
      await waitTransaction(
        this._subdomainRegistrarContract.register(keccak256(toUtf8Bytes(username)), address),
      )
    }

    const usernameHash = this.hashUsername(username)

    await waitTransaction(
      this._ensRegistryContract.setResolver(usernameHash, this._publicResolverContract.address),
    )

    await this.setUsernamePublicKey(usernameHash, address, publicKey)
  }

  /**
   * Returns public key of registered username
   * @param username
   * @returns public key
   */
  public async getPublicKey(username: string): Promise<string> {
    const [publicKeyX, publicKeyY] = await this._publicResolverContract.pubkey(this.hashUsername(username))

    const publicKey = joinPublicKey(publicKeyX, publicKeyY)

    if (isPublicKeyValid(publicKey)) {
      throw new Error('Public key is not set or is invalid')
    }

    return publicKey
  }

  /**
   * Fetches all ENS data related to the provided username
   * @param username ENS username
   * @returns
   */
  public getUserData(username: string): Promise<EnsUserData> {
    return this._publicResolverContract.getAll(this.hashUsername(username))
  }

  /**
   * Sets user's public key to the user's ENS entry
   * @param username ENS username namehash value
   * @param address Owner of the username
   * @param publicKey Public key that will be added to ENS
   */
  private setUsernamePublicKey(usernameHash: string, address: string, publicKey: string): Promise<void> {
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)
    const content = '0x00'
    const name = 'subdomain-hidden'
    return waitTransaction(
      this._publicResolverContract.setAll(
        usernameHash,
        address,
        content,
        '0x00',
        publicKeyX,
        publicKeyY,
        name,
      ),
    )
  }

  private hashUsername(subdomain: string): string {
    return namehash(`${subdomain}.${this.domain}`)
  }
}

export default ENS
