import { DappRegistry, Environments, getDappRegistryEnvironmentConfig } from '../js-library'

async function grantRoles() {
  const dappRegistry = new DappRegistry(getDappRegistryEnvironmentConfig(Environments.GOERLI))

  dappRegistry.connect(process.env.GOERLI_PRIVATE_KEY as string)

  const validatorAddress = '0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419'

  await dappRegistry.grantValidatorRole(validatorAddress)

  const isValidator = await dappRegistry.isValidator(validatorAddress)

  console.log('Validator address granted: ', isValidator)
}

grantRoles()
  .then(() => console.log('Complete'))
  .catch(console.error)
