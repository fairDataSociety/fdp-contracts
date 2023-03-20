import { ContractTransaction, providers } from 'ethers'
import { ServiceRequest } from '../../src/model/service-request.model'
import { waitRequestTransaction } from '../../src/utils/tx'

describe('tx module tests', () => {
  test('waitRequestTransaction request should successfully complete after several failures', async () => {
    const request: ServiceRequest<void> = {
      completedTxs: [],
      stage: 0,
      data: undefined,
    }

    const provider: providers.Provider = {
      waitForTransaction: jest.fn(),
    } as unknown as providers.Provider

    // The first transaction should successfully complete
    provider.waitForTransaction = jest.fn().mockResolvedValue(true)

    await waitRequestTransaction(provider, request, () =>
      Promise.resolve({ hash: '1' } as unknown as ContractTransaction),
    )

    expect(request.completedTxs.length).toEqual(1)
    expect(request.completedTxs[0]).toEqual({ hash: '1' })
    expect(request.pendingTx).toBeFalsy()

    // The second transaction should timeout but successfully complete
    provider.waitForTransaction = jest
      .fn()
      .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 10)))

    let errorMessage = ''
    try {
      await waitRequestTransaction(
        provider,
        request,
        () => Promise.resolve({ hash: '2' } as unknown as ContractTransaction),
        0,
      )
    } catch (error) {
      errorMessage = String(error)
    }

    expect(errorMessage).toEqual('Error: Transaction timeout')
    expect(request.completedTxs.length).toEqual(1)
    expect(request.completedTxs[0]).toEqual({ hash: '1' })
    expect(request.pendingTx).toEqual({ hash: '2' })

    // The pending transaction should instantly resolve
    provider.waitForTransaction = jest.fn().mockResolvedValue(true)

    let newTxCreated = false

    await waitRequestTransaction(provider, request, () => {
      newTxCreated = true
      return Promise.resolve({ hash: '3' } as unknown as ContractTransaction)
    })

    expect(newTxCreated).toBeFalsy()
    expect(request.completedTxs.length).toEqual(2)
    expect(request.completedTxs[0]).toEqual({ hash: '1' })
    expect(request.completedTxs[1]).toEqual({ hash: '2' })
    expect(request.pendingTx).toBeFalsy()

    // The third transaction should fail
    provider.waitForTransaction = jest.fn().mockRejectedValue(new Error('Some error'))

    errorMessage = ''
    try {
      await waitRequestTransaction(provider, request, () =>
        Promise.resolve({ hash: '3' } as unknown as ContractTransaction),
      )
    } catch (error) {
      errorMessage = String(error)
    }

    expect(errorMessage).toEqual('Error: Some error')
    expect(request.completedTxs.length).toEqual(2)
    expect(request.completedTxs[0]).toEqual({ hash: '1' })
    expect(request.completedTxs[1]).toEqual({ hash: '2' })
    expect(request.pendingTx).toBeFalsy()

    // Second time the third transaction should be successful
    provider.waitForTransaction = jest.fn().mockResolvedValue(true)

    await waitRequestTransaction(provider, request, () =>
      Promise.resolve({ hash: '3' } as unknown as ContractTransaction),
    )

    expect(request.completedTxs.length).toEqual(3)
    expect(request.completedTxs[0]).toEqual({ hash: '1' })
    expect(request.completedTxs[1]).toEqual({ hash: '2' })
    expect(request.completedTxs[2]).toEqual({ hash: '3' })
    expect(request.pendingTx).toBeFalsy()
  })
})
