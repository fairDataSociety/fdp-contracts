import { Environment } from '../model/environment.enum'
import { ContractMetadata } from '../model/contracts-metadata.model'
import ENSRegistryContractLocal from '../contracts/ENSRegistry.sol/ENSRegistry.json'
import PublicResolverContractLocal from '../contracts/PublicResolver.sol/PublicResolver.json'
import SubdomainRegistrarContractLocal from '../contracts/SubdomainRegistrar.sol/SubdomainRegistrar.json'

export const ENVIRONMENT_RPC_URLS = {
  [Environment.LOCALHOST]: 'http://127.0.0.1:9545/',
}

export const CONTRACTS_METADATA: { [environment: string]: ContractMetadata } = {
  [Environment.LOCALHOST]: {
    ENSRegistryContract: ENSRegistryContractLocal,
    PublicResolverContract: PublicResolverContractLocal,
    SubdomainRegistrarContract: SubdomainRegistrarContractLocal,
  },
}
