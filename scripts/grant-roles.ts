import { DappRegistry } from '../js-library'

async function grantRoles() {
  const dappRegistry = new DappRegistry({
    rpcUrl: 'https://xdai.dev.fairdatasociety.org/',
    contractAddress: '0x3F6fA527C6F08e1131791E7e1682715325DADaE2',
  })

  dappRegistry.connect(process.env.GOERLI_PRIVATE_KEY as string)

  const validatorAddress = '0xd27ffA0e47Fca8D3E757B4d2C408169859B8c419'

  await dappRegistry.grantValidatorRole(validatorAddress)

  const isValidator = await dappRegistry.isValidator(validatorAddress)

  console.log('Validator address granted: ', isValidator)
}

grantRoles()
  .then(() => console.log('Complete'))
  .catch(console.error)
