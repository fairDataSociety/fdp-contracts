import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Signatues', function () {
  it('should recover postage stamp signature', async function () {
    const accounts = await ethers.getSigners()

    const PostageStampSig = await ethers.getContractFactory('PostageStampSig')
    const postageStampSig = await PostageStampSig.deploy()
    await postageStampSig.deployed()

    const signer = accounts[0]
    const chunkAddrHex = '0x98371fb1297da62c1355abd8f9a7e43dd20cd5ddb9db7ba7c2d99e35e7afb58f'
    const batchIdHex = '0xba73d3e3dfe9bd95595c6fa67f682adf3fde207ab339cffd7cc24a1905389a9c'
    const index = BigInt('1039382085632')
    const ts = BigInt('1673624779490180673')

    const hash = await postageStampSig.getMessageHash(chunkAddrHex, batchIdHex, index, ts)
    const sig = await signer.signMessage(ethers.utils.arrayify(hash))

    const ethHash = await postageStampSig.getEthSignedMessageHash(hash)

    expect(signer.address).to.equal(await postageStampSig.recoverSigner(ethHash, sig))

    // Correct signature and message returns true
    expect(await postageStampSig.verify(signer.address, sig, chunkAddrHex, batchIdHex, index, ts)).to.equal(true)

    // Incorrect message returns false
    expect(await postageStampSig.verify(signer.address, sig, chunkAddrHex, batchIdHex, '0', ts)).to.equal(false)
  })

  it('should recover Single Owner Chunk signature', async function () {
    const accounts = await ethers.getSigners()

    const SocSig = await ethers.getContractFactory('SocSig')
    const socSig = await SocSig.deploy()
    await socSig.deployed()

    const signer = accounts[0]
    const topicHex = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const chunkAddrHex = '0x98371fb1297da62c1355abd8f9a7e43dd20cd5ddb9db7ba7c2d99e35e7afb58f'

    const hash = await socSig.getMessageHash(topicHex, chunkAddrHex)
    const sig = await signer.signMessage(ethers.utils.arrayify(hash))

    const ethHash = await socSig.getEthSignedMessageHash(hash)

    expect(signer.address).to.equal(await socSig.recoverSigner(ethHash, sig))

    // Correct signature and message returns true
    expect(await socSig.verify(signer.address, sig, topicHex, chunkAddrHex)).to.equal(true)

    // Incorrect message returns false
    expect(
      await socSig.verify(
        signer.address,
        sig,
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        chunkAddrHex,
      ),
    ).to.equal(false)
  })
})
