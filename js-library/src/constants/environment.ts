import { Environment } from '../model/environment.enum'
import ENSRegistryContractLocal from '../contracts/ENSRegistry/ENSRegistry.json'
import PublicResolverContractLocal from '../contracts/PublicResolver/PublicResolver.json'
import SubdomainRegistrarContractLocal from '../contracts/SubdomainRegistrar/SubdomainRegistrar.json'

export const ENVIRONMENT_RPC_URLS = {
  [Environment.LOCALHOST]: 'http://127.0.0.1:9545/',
}

export const CONTRACTS_METADATA = {
  [Environment.LOCALHOST]: {
    ENSRegistryContract: ENSRegistryContractLocal,
    PublicResolverContract: PublicResolverContractLocal,
    SubdomainRegistrarContract: SubdomainRegistrarContractLocal,
  },
}
