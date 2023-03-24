import childProcess from 'child_process'
import { promisify } from 'util'

const exec = promisify(childProcess.exec)

export type ContractsChange = 'ENS' | 'BMT' | 'DAPP_REGISTRY'

function processShellResponse({ stdout, stderr }: { stdout: string; stderr: string }): string {
  if (stderr) {
    throw new Error(stderr)
  }

  return stdout
}

async function getPreviousReleaseCommitHash(): Promise<string> {
  return processShellResponse(
    await exec('git log --all -n 1 --grep="chore(master): release contracts" --pretty=format:"%h"'),
  )
}

async function getChangedFiles(): Promise<string[]> {
  const lastReleaseCommitHash = await getPreviousReleaseCommitHash()
  const changesResponse = processShellResponse(await exec(`git diff --name-only HEAD ${lastReleaseCommitHash}`))
  return changesResponse.split('\n')
}

function hasChange(changedFiles: string[], filename: string): boolean {
  return changedFiles.some(changedFile => changedFile.includes(filename))
}
/**
 * Checks which sets of contracts have been changed since previous release
 * @returns Example return ['ENS', 'BMT']
 */
export default async function getChanges(): Promise<ContractsChange[]> {
  const changes: ContractsChange[] = []
  const changedFiles = await getChangedFiles()

  if (
    hasChange(changedFiles, 'contracts/ENSRegistry.sol') ||
    hasChange(changedFiles, 'contracts/FDSRegistrar.sol') ||
    hasChange(changedFiles, 'contracts/PublicResolver.sol')
  ) {
    changes.push('ENS')
  }

  if (hasChange(changedFiles, 'contracts/BMTChunk.sol') || hasChange(changedFiles, 'contracts/BMTFile.sol')) {
    changes.push('BMT')
  }

  if (hasChange(changedFiles, 'contracts/DappRegistry.sol')) {
    changes.push('DAPP_REGISTRY')
  }

  return changes
}
