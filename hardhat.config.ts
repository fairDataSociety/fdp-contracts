import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import * as dotenv from 'dotenv'
import 'hardhat-gas-reporter'
import { HardhatUserConfig, task } from 'hardhat/config'
import 'solidity-coverage'

dotenv.config()

task('send', 'Send coin from the first available account to the passed address', async (taskArgs: any, hre) => {
  const accounts = await hre.ethers.getSigners()
  const account = accounts[0]
  const tx = {
    to: taskArgs.to,
    value: hre.ethers.utils.parseEther(taskArgs.amount),
  }
  const response = await account.sendTransaction(tx)
  console.log(`${taskArgs.amount} ETH has been sent to ${taskArgs.to}.\n\tTxId: ${response.hash}`)
})
  .addParam('amount', 'The Ether to being send')
  .addParam('to', 'Ethereum Address of the recipient')

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

task('balances', 'Prints the balances of accounts')
  .addOptionalParam('address', "Gives back the given address' balance")
  .setAction(async ({ address }, hre) => {
    const { provider } = hre.ethers
    const printBalance = async (address: string): Promise<void> => {
      const balance = await provider.getBalance(address)
      const balanceInEther = hre.ethers.utils.formatEther(balance)
      console.log('account', address, 'balance (ETH)', balanceInEther.toString())
    }
    if (address) {
      await printBalance(address)
      return
    }
    const accounts = await hre.ethers.getSigners()
    for (const account of accounts) {
      await printBalance(account.address)
    }
  })

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    docker: {
      url: process.env.BEE_BLOCKCHAIN_URL || 'http://localhost:9545',
    },
    goerli: {
      url: process.env.GOERLI_URL || '',
      accounts: process.env.GOERLI_PRIVATE_KEY !== undefined ? [process.env.GOERLI_PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || '',
      accounts: process.env.SEPOLIA_PRIVATE_KEY !== undefined ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
    optimism_goerli: {
      url: process.env.OPTIMISM_GOERLI_URL || '',
      accounts: process.env.OPTIMISM_GOERLI_PRIVATE_KEY !== undefined ? [process.env.OPTIMISM_GOERLI_PRIVATE_KEY] : [],
    },
    arbitrum_goerli: {
      url: process.env.ARBITRUM_GOERLI_URL || '',
      accounts: process.env.ARBITRUM_GOERLI_PRIVATE_KEY !== undefined ? [process.env.ARBITRUM_GOERLI_PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 400000,
  },
}

export default config
