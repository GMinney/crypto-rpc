import { ethers } from "ethers";

export interface IEthRpcBalances {
    account: string;
    balance: bigint;
}

export interface IEthRpcEmitData {
    address: string;
    amount: bigint;
    id: string;
    txid?: string;
    error?: string;
}

export interface IEthRpcGetTransactionReceipt {
    hash: string;
    type: string;
    nonce: string;
    blockHash?: string;
    blockNumber?: string;
    transactionIndex?: string;
    from: string;
    to?: string | null;
    value: string;
    gas: string;
    gasPrice: string;
    input: string;
    v?: string;
    r: string;
    s: string;
    confirmations?: bigint;
}


export interface IEthRpcDecodeDataTransaction {
    to: string | null;
    from: string | null;
    nonce?: number;
    txid: string | null;
    value?: number;
    type?: number;
    gasPrice?: number;
    maxPriorityFeePerGas?: number;
    maxFeePerGas?: number;
    gasLimit?: number;
    data?: string;
    decodedData?: ethers.TransactionDescription | null;
  };

