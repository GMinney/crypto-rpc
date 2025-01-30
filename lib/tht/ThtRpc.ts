// import { ThoughtRPC } from "./thought";
import * as promptly from 'promptly';
import * as util from 'util';
import EventEmitter from "events";
// import * as http from "http";
// import * as https from "https";
import { IRpcClientOptions } from '../../../thoughtd-rpc/lib/types';
import { ThoughtRpcClient } from "../../../thoughtd-rpc/lib";



const passwordPromptAsync = util.promisify(promptly.password);

export class THTRPC extends ThoughtRpcClient {
  opts: IRpcClientOptions; 
  thoughtRpcClient: ThoughtRpcClient;
  emitter: EventEmitter; 


  //TODO: write a constructor to take opts as an argument
  // args: { protocol: typeof http | typeof https; };
  // httpOptions: { rejectUnauthorized: boolean; };
  



  constructor(opts: IRpcClientOptions) {
    // const {
    //   rpcPort: port,
    //   rpcUser: user,
    //   rpcPass: pass,
    //   host,
    //   protocol
    // } = config;
    // const thoughtRpcOpts: IRpcClientOptions = {host, port, user, pass, protocol};

    super(opts);
    this.opts = opts;
    this.thoughtRpcClient = new ThoughtRpcClient(opts);
    this.emitter = new EventEmitter();
  }

  asyncCall(method: string, args: any): any {
    return new Promise((resolve, reject) => {
      this.thoughtRpcClient[method](...args, (err, response) => {
        if (err instanceof Error) {
          return reject(err);
        }

        const { error, result } = response;
        if (error) {
          err = new Error(error.message);
          err.code = error.code; // used by methods below
          err.conclusive = true; // used by server
          return reject(err);
        }
        if (result && result.errors) {
          return reject(new Error(result.errors[0]));
        }
        return resolve(result);
      });
    });
  }

  // async cmdlineUnlock({ time }) {
  //   return this.asyncCall('cmdlineUnlock', [time]);
  // }

  async sendMany({ account, batch, options }) {
    let batchClone = Object.assign({}, batch);
    for (let tx in batch) {
      batchClone[tx] /= 1e8;
    }
    if (!account) {
      account = '';
    }
    const paramArray = [account, batchClone];
    if (options) {
      paramArray.push(options);
    }
    return this.asyncCall('sendMany', paramArray);
  }

  async sendToAddress({ address, amount }) {
    return this.asyncCall('sendToAddress', [address, amount / 1e8]);
  }

  async unlockAndSendToAddress({ address, amount, passphrase }) {
    if (passphrase === undefined) {
      passphrase = await passwordPromptAsync();
    }
    await this.walletUnlock({ passphrase, time: 10800 });
    const tx = await this.sendToAddress({ address, amount });
    await this.walletLock();
    return tx;
  }

  


  async unlockAndSendToAddressMany({ account, payToArray, passphrase, time = 10800, maxValue = 10 * 1e8, maxOutputs = 1 }) {
    let payToArrayClone = [...payToArray];
    if (passphrase === undefined) {
      passphrase = await passwordPromptAsync();
    }
    await this.walletUnlock({ passphrase, time });
    let payToArrayResult: PaymentType[] = [];
    while (payToArrayClone.length) {
      let currentValue = 0;
      let currentOutputs = 0;
      let paymentsObj = {};
      let paymentsArr: PaymentType[] = [];
      if (payToArrayClone.length < maxOutputs) {
        maxOutputs = payToArrayClone.length;
      }
      while (currentValue < maxValue && currentOutputs < maxOutputs) {
        // extract the first payment and destruct it
        const { address, amount, id } = payToArrayClone.shift();
        paymentsArr.push({ address, amount, id });
        const emitAttempt = {
          address,
          amount,
          id
        };
        this.emitter.emit('attempt', emitAttempt);
        if (!paymentsObj[address]) {
          paymentsObj[address] = 0;
        }
        paymentsObj[address] += amount;
        currentValue += amount;
        currentOutputs++;
      }
      let emitData: PaymentType = {
        txid: '',
        vout: '',
        id: '',
        amount: '',
        address: '',
      };
      let txid;
      let txDetails;
      let options = {}; // no options
      try {
        txid = await this.sendMany({ account, batch: paymentsObj, options});
        emitData.txid = txid;
      } catch (error) {
        if (error instanceof Error) {
          emitData.error = error;
        }

      }
      try {
        if (txid) {
          let detail = false;
          let verbose = 1;
          txDetails = await this.getTransaction({ txid, detail, verbose });
        }
      } catch (error) {
        console.error(`Unable to get transaction details for txid: ${txid}.`);
        console.error(error);
      }
      for (let payment of paymentsArr) {
        if (txDetails && txDetails.vout) {
          for (let vout of txDetails.vout) {
            if (
              vout.scriptPubKey.address === payment.address ||
              // Legacy
              (Array.isArray(vout.scriptPubKey.addresses) && vout.scriptPubKey.addresses[0].includes(payment.address))
            ) {
              emitData.vout = vout.n;
              payment.vout = emitData.vout;
            }
          }
        }
        emitData.id = payment.id;
        emitData.amount = payment.amount;
        emitData.address = payment.address;
        payment.txid = emitData.txid;
        if (emitData.error) {
          this.emitter.emit('failure', emitData);
          payment.error = emitData.error;
        } else {
          this.emitter.emit('success', emitData);
        }
        payToArrayResult.push(payment);
      }
    }
    await this.walletLock();
    this.emitter.emit('done');
    return payToArrayResult;
  }

  async getWalletInfo(): Promise<WalletInfo> {
    return this.asyncCall('getWalletInfo', []);
  }

  async isWalletEncrypted() {
    const walletInfo = await this.getWalletInfo();
    return walletInfo.hasOwnProperty('unlocked_until');
  }

  async isWalletLocked() {
    const walletInfo = await this.getWalletInfo();
    return walletInfo['unlocked_until'] === 0;
  }

  async walletUnlock({ passphrase, time }) {
    if (await this.isWalletEncrypted()) {
      await this.asyncCall('walletPassPhrase', [passphrase, time]);
    }
    this.emitter.emit('unlocked', time);
  }

  async walletLock() {
    if (await this.isWalletEncrypted()) {
      await this.asyncCall('walletLock', []);
    }
    this.emitter.emit('locked');
  }

  async estimateFee({ nBlocks, mode }) {
    const args = [nBlocks];
    if (mode) { // We don't want args[1] to be undefined/null
      args.push(mode);
    }
    const { feerate: feeRate } = await this.asyncCall('estimateSmartFee', args);
    const notionsPerKb = Math.round(feeRate * 1e8);
    const notionsPerByte = notionsPerKb / 1e3;
    return notionsPerByte;
  }

  async getBalance() {
    const balanceInfo = await this.asyncCall('getWalletInfo', []);
    return balanceInfo.balance * 1e8;
  }

  async getBestBlockHash() {
    return this.asyncCall('getBestBlockHash', []);
  }

  async getTransaction({ txid, detail = false, verbose }) {
    const tx = await this.getRawTransaction({ txid });

    if (tx && detail) {
      for (let input of tx.vin) {
        const prevTx = await this.getTransaction({ txid: input.txid, verbose });
        const utxo = prevTx.vout[input.vout];
        const { value } = utxo;
        const address = utxo.scriptPubKey.address ||
          // Legacy  
          (utxo.scriptPubKey.addresses && utxo.scriptPubKey.addresses.length && utxo.scriptPubKey.addresses[0]);
        input = Object.assign(input, {
          value,
          address,
          confirmations: prevTx.confirmations
        });
      }
      tx.unconfirmedInputs = tx.vin.some(input => !input.confirmations || input.confirmations < 1);
      let totalInputValue = tx.vin.reduce(
        (total, input) => total + input.value * 1e8,
        0
      );
      let totalOutputValue = tx.vout.reduce(
        (total, output) => total + output.value * 1e8,
        0
      );
      tx.fee = totalInputValue - totalOutputValue;
    }

    return tx;
  }

  /**
   * Returns transactions for the node's wallet(s). Note, the RPC method is `listtransactions`, but actually it returns
   *   a transaction object for each wallet address. For example, if you sent a tx with 2 inputs from your wallet, this
   *   RPC method would return 2 tx objects with the same txid, one for each input.
   * @param {string} label defaults to '*', returns incoming transactions paying to addresses with the specified label
   * @param {number} count defaults to 10, the number of transactions to return
   * @param {number} skip defaults to 0, the number of transactions to skip
   * @param {boolean} inclWatchOnly defaults to true, include watch-only addresses in the returned transactions
   * @returns {Array}
   */
  async getTransactions({ label = '*', count = 10, skip = 0, inclWatchOnly = true } = {}) {
    return this.asyncCall('listTransactions', [label, count, skip, inclWatchOnly]);
  }

  async getRawTransaction({ txid, verbose = true }) {
    try {
      return await this.asyncCall('getRawTransaction', [txid, verbose]);
    } catch (err) {
      if (err instanceof Error){
        // Handle err.code at some point
        // if (err.code === -5) {
        //   return null;
        // }
        // throw err;
      }

    }
  }

  async sendRawTransaction({ rawTx }) {
    return this.asyncCall('sendRawTransaction', [rawTx]);
  }

  async decodeRawTransaction({ rawTx }) {
    return this.asyncCall('decodeRawTransaction', [rawTx]);
  }

  async getBlock({ hash, verbose = 1 }) {
    return this.asyncCall('getBlock', [hash, verbose]);
  }

  async getBlockHash({ height }) {
    return this.asyncCall('getBlockHash', [height]);
  }

  async getConfirmations({ txid }) {
    const detail = true;
    const verbose = true;
    const tx = await this.getTransaction({ txid, detail, verbose });
    if (!tx) {
      return null;
    }
    if (tx.blockhash === undefined) {
      return 0;
    }
    return tx.confirmations;
  }

  async getTip() {
    const blockchainInfo = await this.getServerInfo();
    const { blocks: height, bestblockhash: hash } = blockchainInfo;
    return { height, hash };
  }

  async getTxOutputInfo({ txid, vout, includeMempool = false, transformToThoughtcore }) {
    const txidInfo = await this.asyncCall('gettxout', [txid, vout, includeMempool]);
    if (!txidInfo) {
      this.emitter.emit('error', new Error(`No info found for ${txid}`));
      return null;
    }
    if (transformToThoughtcore) {
      let thoughtcoreUtxo = {
        mintIndex: vout,
        mintTxid: txid,
        address: txidInfo.scriptPubKey.address || txidInfo.scriptPubKey.addresses[0], // Legacy
        script: txidInfo.scriptPubKey.hex,
        value: txidInfo.value,
        confirmations: txidInfo.confirmations
      };
      return thoughtcoreUtxo;
    }
    return txidInfo;
  }

  async validateAddress({ address }) {
    const validateInfo = await this.asyncCall('validateaddress', [address]);
    const { isvalid } = validateInfo;
    return isvalid;
  }

  getAccountInfo() {
    return {};
  }

  getServerInfo() {
    return this.asyncCall('getblockchaininfo', []);
  }
}

interface PaymentType {
  address: string;
  amount: string;
  id: string;
  txid?: string;
  vout?: string;
  error?: Error;
}

interface WalletInfo {
  unlocked_until: number;
}