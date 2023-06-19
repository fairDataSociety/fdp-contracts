import { providers, Wallet } from 'ethers'
import { DappRegistry, Environments, getDappRegistryEnvironmentConfig } from '../js-library'

async function grantRoles() {
  const config = getDappRegistryEnvironmentConfig(Environments.SEPOLIA)
  const dappRegistry = new DappRegistry(config)

  const signer = new Wallet(process.env.SEPOLIA_PRIVATE_KEY as string, new providers.JsonRpcProvider(config.rpcUrl))

  dappRegistry.connect(signer)

  const validatorAddress = '0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419'

  await dappRegistry.grantValidatorRole(validatorAddress)

  const isValidator = await dappRegistry.isValidator(validatorAddress)

  console.log('Validator address granted: ', isValidator)
}

grantRoles()
  .then(() => console.log('Complete'))
  .catch(console.error)
