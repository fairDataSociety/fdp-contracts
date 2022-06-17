import { utils, Contract, providers, ContractFactory } from 'ethers'
import { ENVIRONMENT_CONFIGS } from '../../src/constants/environment'
import { Environments } from '../../src/model/environments.enum'
import { Environment } from '../../src/model/environment.model'
import ENSRegistryContractLocal from '../../src/contracts/ENSRegistry/ENSRegistry.json'
import PublicResolverContractLocal from '../../src/contracts/PublicResolver/PublicResolver.json'
import FDSRegistrarContractLocal from '../../src/contracts/FDSRegistrar/FDSRegistrar.json'
import { Wallet } from 'ethers'

const { keccak256, toUtf8Bytes, namehash } = utils

export type SignerOrProvider = Wallet

export const ENSRegistryContract = ENSRegistryContractLocal
export const PublicResolverContract = PublicResolverContractLocal
export const FDSRegistrarContract = FDSRegistrarContractLocal

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

function keccak256FromUtf8Bytes(value: string) {
  return keccak256(toUtf8Bytes(value))
}

export async function deploy(
  config: Environment,
  signerOrProvider: SignerOrProvider,
): Promise<string> {
  const _provider = new providers.JsonRpcProvider(config.rpcUrl)

  const { ensRegistry, fdsRegistrar, publicResolver } = config.contractAddresses

  const ens = new Contract(ensRegistry, ENSRegistryContract.abi, _provider)
  const c = new ContractFactory(FDSRegistrarContract.abi, FDSRegistrarContract.bytecode, signerOrProvider)
  const registrar = await c.deploy(ensRegistry)
  await registrar.addController(signerOrProvider.address)
  await ens
    .connect(signerOrProvider)
    .setSubnodeOwner(ZERO_HASH, keccak256FromUtf8Bytes('fds'), registrar.address)

  return registrar.address
}
