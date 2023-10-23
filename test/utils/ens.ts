import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { ENSRegistry, FDSNameResolver, FDSRegistrar, FDSReverseRegistrar, PublicResolver } from '../../typechain'

export const DOMAIN = 'fds'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

export interface ENSContracts {
  ens: ENSRegistry
  registrar: FDSRegistrar
  resolver: PublicResolver
  reverseRegistrar: FDSReverseRegistrar
  nameResolver: FDSNameResolver
}

export function keccak256FromUtf8Bytes(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value))
}

export async function initializeEns(controllerAccount: SignerWithAddress): Promise<ENSContracts> {
  const ENS = await ethers.getContractFactory('ENSRegistry')
  const ens = await ENS.deploy()
  await ens.deployed()
  const FDSRegistrar = await ethers.getContractFactory('FDSRegistrar')
  const registrar = await FDSRegistrar.deploy(ens.address)
  await registrar.addController(controllerAccount.address)
  await ens.setSubnodeOwner(ZERO_HASH, keccak256FromUtf8Bytes('fds'), registrar.address)

  const publicResolver = await ethers.getContractFactory('PublicResolver')
  const resolver = await publicResolver.deploy(ens.address)

  console.log(`PublicResolver deployed to: ${resolver.address}`)
  await resolver.deployed()
  await registrar.setResolver(resolver.address)

  const FDSReverseRegistrar = await ethers.getContractFactory('FDSReverseRegistrar')
  const reverseRegistrar = await FDSReverseRegistrar.deploy(ens.address)
  await reverseRegistrar.deployed()

  console.log(`FDSReverseRegistrar deployed to: ${reverseRegistrar.address}`)
  const FDSNameResolver = await ethers.getContractFactory('FDSNameResolver')
  const nameResolver = await FDSNameResolver.deploy(reverseRegistrar.address)

  await nameResolver.deployed()

  await (await reverseRegistrar.setDefaultResolver(nameResolver.address)).wait()

  return {
    ens,
    registrar,
    resolver,
    reverseRegistrar,
    nameResolver,
  }
}
