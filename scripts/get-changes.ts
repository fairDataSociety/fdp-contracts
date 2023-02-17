import childProcess from 'child_process'
import { promisify } from 'util'

const exec = promisify(childProcess.exec)

export type ContractsChange = 'ENS' | 'BMT'

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
/**
 * Checks which sets of contracts have been changed since previous release
 * @returns Example return ['ENS', 'BMT']
 */
export default async function getChanges(): Promise<ContractsChange[]> {
  const changes: ContractsChange[] = []
  const changedFiles = await getChangedFiles()

  if (
    changedFiles.includes('contracts/ENSRegistry.sol') ||
    changedFiles.includes('contracts/FDSRegistrar.sol') ||
    changedFiles.includes('contracts/PublicResolver.sol')
  ) {
    changes.push('ENS')
  }

  if (changedFiles.includes('contracts/BMTChunk.sol') || changedFiles.includes('contracts/BMTFile.sol')) {
    changes.push('BMT')
  }

  return changes
}
