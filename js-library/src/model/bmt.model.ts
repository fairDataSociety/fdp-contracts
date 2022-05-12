import { BigNumberish, BytesLike } from "ethers";

export interface BMTChunkInclusionProof{
    span: BigNumberish;
    spanBytes: BytesLike;
    sisterSegments: BytesLike[]
}
