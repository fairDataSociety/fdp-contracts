export async function waitTransaction(call: Promise<{ wait: () => Promise<void> }>): Promise<void> {
  const tx = await call
  await tx.wait()
}
