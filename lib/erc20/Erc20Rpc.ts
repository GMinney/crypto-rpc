import { EthRPC } from '../eth/EthRpc';
import { IEthRpcBalances, IEthRpcDecodeDataTransaction } from '../eth/EthTypes';
import erc20 from "./erc20.json" with { type: "json" };
import { ethers } from 'ethers';

export class Erc20RPC extends EthRPC {
  tokenContractAddress: string;
  erc20Contract: any;
  constructor(config) {
    super(config);
    this.tokenContractAddress = config.tokenContractAddress;
    this.erc20Contract = new this.web3.eth.Contract(
      erc20,
      this.tokenContractAddress
    );
  }

  // this will only work on ERC20 tokens with decimals
  async sendToAddress({ address, amount, fromAccount, passphrase, gasPrice, nonce, gas }) {
    if (!gasPrice) {
      gasPrice = await this.estimateGasPrice();
    }
    const account = fromAccount || await this.getAccount();
    const amountStr = Number(amount).toLocaleString('fullwide', { useGrouping: false });
    const contractData = this.erc20Contract.methods
      .transfer(address, amountStr)
      .encodeABI();

    if (passphrase) {
      this.emitter.emit('unlockedForOne');
    }

    let result;
    try {
      result = await this.web3.eth.personal.sendTransaction(
        {
          from: account,
          gasPrice,
          data: contractData,
          to: this.tokenContractAddress,
          nonce,
          gas
        },
        passphrase
      );

      if (passphrase) {
        this.emitter.emit('locked');
      }
    } catch (error) {
      this.emitter.emit('locked');
      throw error;
    }

    return result;
  }

  async getBalance({ address }) {
    if (address) {
      const balance = await this.erc20Contract.methods
        .balanceOf(address)
        .call();
      return balance;
    } else {
      const accounts = await this.web3.eth.getAccounts();
      const balances: IEthRpcBalances[] = [];
      for (let account of accounts) {
        const balance = await this.getBalance({ address: account });
        balances.push({ account, balance });
      }
      return balances;
    }
  }

  async decodeRawTransaction({ rawTx }): Promise<IEthRpcDecodeDataTransaction> {
    // const decodedEthTx: IEthRpcDecodeDataTransaction = super.decodeRawTransaction({ rawTx });
    const decodedEthTx = ethers.Transaction.from(rawTx);
    const internalTransaction: IEthRpcDecodeDataTransaction = {
      to: decodedEthTx.to,
      from: decodedEthTx.from,
      nonce: decodedEthTx.nonce,
      txid: decodedEthTx.hash,
      value: Number(decodedEthTx.value) / 10 ** 18,
      type: Number(decodedEthTx.type),
      gasPrice: Number(decodedEthTx.gasPrice) / 10 ** 9,
      maxPriorityFeePerGas: Number(decodedEthTx.maxPriorityFeePerGas) / 10 ** 9,
      maxFeePerGas: Number(decodedEthTx.maxFeePerGas) / 10 ** 9,
      gasLimit: Number(decodedEthTx.gasLimit),
      data: decodedEthTx.data
    }
    if (decodedEthTx.data) {
      try {
        const erc20Contract = new ethers.Contract(this.tokenContractAddress, erc20);

        internalTransaction.decodedData = await erc20Contract.interface.parseTransaction({ data: decodedEthTx.data });
      } catch (err) {
        internalTransaction.decodedData = undefined;
      }
    }
    else {
      internalTransaction.decodedData = null;
    }
    return internalTransaction;
  }
}

