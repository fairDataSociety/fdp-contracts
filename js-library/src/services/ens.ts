import { utils, Contract, Signer, providers } from 'ethers'
import { NULL_ADDRESS } from '../constants/constants'
import ENSRegistryContract from '../contracts/ENSRegistry.sol/ENSRegistry.json'
import PublicResolverContract from '../contracts/PublicResolver.sol/PublicResolver.json'
import SubdomainRegistrarContract from '../contracts/SubdomainRegistrar.sol/SubdomainRegistrar.json'
import { waitTransaction } from '../utils/tx'
import { joinPublicKey, isPublicKeyValid, splitPublicKey } from '../utils/keys'

const { keccak256, toUtf8Bytes, namehash } = utils

/**
 * Contract addresses
 */
export const ENS_REGISTRY_ADDRESS = process.env.ENS_REGISTRY_ADDRESS
export const PUBLIC_RESOLVER_ADDRESS = process.env.PUBLIC_RESOLVER_ADDRESS
export const SUBDOMAIN_REGISTRAR_ADDRESS = process.env.SUBDOMAIN_REGISTRAR_ADDRESS

/**
 * Contract metadata
 */
export const ENSRegistryMeta = ENSRegistryContract
export const PublicResolverMeta = PublicResolverContract
export const SubdomainRegistrarMeta = SubdomainRegistrarContract

/**
 * ENS Class
 * Provides interface for interaction with the ENS smart contracts
 */
export class ENS {
  private _provider: providers.JsonRpcProvider
  private ensRegistryContract: Contract
  private subdomainRegistrarContract: Contract
  private publicResolverContract: Contract

  constructor(rpcUrl = 'http://127.0.0.1:9545/', private domain = 'fds.eth') {
    this._provider = new providers.JsonRpcProvider(rpcUrl)

    this.ensRegistryContract = new Contract(
      ENS_REGISTRY_ADDRESS as string,
      ENSRegistryContract.abi,
      this._provider,
    )
    this.publicResolverContract = new Contract(
      PUBLIC_RESOLVER_ADDRESS as string,
      PublicResolverContract.abi,
      this._provider,
    )
    this.subdomainRegistrarContract = new Contract(
      SUBDOMAIN_REGISTRAR_ADDRESS as string,
      SubdomainRegistrarContract.abi,
      this._provider,
    )
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
  public connect(signerOrProvider: string | providers.Provider | Signer) {
    this.publicResolverContract = this.publicResolverContract.connect(signerOrProvider)
    this.subdomainRegistrarContract = this.subdomainRegistrarContract.connect(signerOrProvider)
    this.ensRegistryContract = this.ensRegistryContract.connect(signerOrProvider)
  }

  /**
   * Returns owner address of the provided username on ENS
   * @param username ENS username
   * @returns owner's address
   */
  public async getUsernameOwner(username: string): Promise<string> {
    const usernameHash = this.hashUsername(username)

    const owner = await this.ensRegistryContract.owner(usernameHash)

    return owner
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
        this.subdomainRegistrarContract.register(keccak256(toUtf8Bytes(username)), address),
      )
    }

    const usernameHash = this.hashUsername(username)

    await waitTransaction(
      this.ensRegistryContract.setResolver(usernameHash, this.publicResolverContract.address),
    )

    await this.setUsernamePublicKey(usernameHash, address, publicKey)
  }

  /**
   * Returns public key of registered username
   * @param username
   * @returns public key
   */
  public async getPublicKey(username: string): Promise<string> {
    const [publicKeyX, publicKeyY] = await this.publicResolverContract.pubkey(this.hashUsername(username))

    const publicKey = joinPublicKey(publicKeyX, publicKeyY)

    if (isPublicKeyValid(publicKey)) {
      throw new Error('Public key is not set')
    }

    return publicKey
  }

  /**
   * Fetches all ENS data related to the provided username
   * @param username ENS username
   * @returns
   */
  public getUserData(username: string): Promise<unknown> {
    return this.publicResolverContract.getAll(this.hashUsername(username))
  }

  /**
   * Sets user's public key to the user's ENS entry
   * @param username ENS username
   * @param address Owner of the username
   * @param publicKey Public key that will be added to ENS
   */
  private setUsernamePublicKey(usernameHash: string, address: string, publicKey: string): Promise<void> {
    const [publicKeyX, publicKeyY] = splitPublicKey(publicKey)
    const content = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const name = 'subdomain-hidden'
    return waitTransaction(
      this.publicResolverContract.setAll(
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
