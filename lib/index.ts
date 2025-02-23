import { THTRPC } from './tht/ThtRpc';
import { EthRPC } from './eth/EthRpc';
// import { Erc20RPC } from './erc20/Erc20Rpc';

const RpcClasses = {
    THT: THTRPC,
    ETH: EthRPC,
};

// const TokenClasses = {
//     ETH: {
//         native: EthRPC,
//         ERC20: Erc20RPC
//     },
//     THT: {
//         native: THTRPC
//     }
// };

interface Config {
    chain: string;
    isEVM: boolean;
    host: string;
    port: number;
    rpcPort: string;
    user: string;
    rpcUser: string;
    pass: string;
    rpcPass: string;
    protocol: string;
    tokens: Object;
}

export class CryptoRpcProvider {
    chain: string;
    config: Config; // Wrtie a config type
    rpcs: Object;
    params: any;

    /**
     * Constructor for CryptoRpcProvider class.
     * @param {Object} config - The configuration object.
     * @param {string} config.chain - The chain to connect to.
     * @param {boolean} config.isEVM - Optional flag indicating if the chain is EVM compatible.
     * @param {string} config.host - The host address for RPC connection.
     * @param {number} config.port - The port for RPC connection.
     * @param {string} config.rpcPort - The port for RPC connection (alternative).
     * @param {string} config.user - The username for RPC connection.
     * @param {string} config.rpcUser - The username for RPC connection (alternative).
     * @param {string} config.pass - The password for RPC connection.
     * @param {string} config.rpcPass - The password for RPC connection (alternative).
     * @param {string} config.protocol - The protocol for RPC connection.
     * @param {Object} config.tokens - Optional tokens configuration.
     */
    constructor(config) {
        this.chain = config.chain;
        if (!RpcClasses[this.chain] && !config.isEVM) {
            throw new Error('Invalid chain specified');
        }
        this.config = Object.assign({}, config, {
            host: config.host,
            port: config.port || config.rpcPort,
            user: config.user || config.rpcUser,
            pass: config.pass || config.rpcPass,
            protocol: config.protocol
        });
        const rpcChain = !config.isEVM ? this.chain : 'ETH';
        this.rpcs = {
            [this.chain]: new RpcClasses[rpcChain](this.config)
        }; // Set the rpcs object with the chain as key and the rpc object as value
        
        // Not worrying about tokens for now
        
        // if (config.tokens) {
        //     Object.entries(config.tokens).forEach(([token, tokenConfig]) => {
        //         const TokenClass = TokenClasses[rpcChain][tokenConfig.type];
        //         const configForToken = Object.assign(tokenConfig, this.config);
        //         this.rpcs[token] = new TokenClass(configForToken);
        //     });
        // }
    }

    has(currency) {
        return !!this.rpcs[currency];
    }

    get(currency = this.chain) {
        return this.rpcs[currency];
    }

    cmdlineUnlock(params) {
        return this.get(params.currency).cmdlineUnlock(params);
    }

    getBalance(params) {
        return this.get(params.currency).getBalance(params);
    }

    sendToAddress(params) {
        return this.get(params.currency).sendToAddress(params);
    }

    walletLock(params) {
        return this.get(params.currency).walletLock(params);
    }

    unlockAndSendToAddress(params) {
        return this.get(params.currency).unlockAndSendToAddress(params);
    }

    unlockAndSendToAddressMany(params) {
        return this.get(params.currency).unlockAndSendToAddressMany(params);
    }

    estimateFee(params) {
        return this.get(params.currency).estimateFee(params);
    }

    estimateMaxPriorityFee(params) {
        const rpc = this.get(params.currency);
        return rpc.estimateMaxPriorityFee ? rpc.estimateMaxPriorityFee(params) : undefined;
    }

    getBestBlockHash(params) {
        return this.get(params.currency).getBestBlockHash(params);
    }

    getTransaction(params) {
        return this.get(params.currency).getTransaction(params);
    }

    getTransactions(params) {
        return this.get(params.currency).getTransactions(params);
    }

    getTransactionCount(params) {
        return this.get(params.currency).getTransactionCount(params);
    }

    getRawTransaction(params) {
        return this.get(params.currency).getRawTransaction(params);
    }

    sendRawTransaction(params) {
        return this.get(params.currency).sendRawTransaction(params);
    }

    decodeRawTransaction(params) {
        return this.get(params.currency).decodeRawTransaction(params);
    }

    getBlock(params) {
        return this.get(params.currency).getBlock(params);
    }

    getBlockHash(params) {
        return this.get(params.currency).getBlockHash(params);
    }

    getConfirmations(params) {
        return this.get(params.currency).getConfirmations(params);
    }

    getTip(params) {
        return this.get(params.currency).getTip(params);
    }

    getTxOutputInfo(params) {
        return this.get(params.currency).getTxOutputInfo(params);
    }

    validateAddress(params) {
        return this.get(params.currency).validateAddress(params);
    }

    getAccountInfo(params) {
        return this.get(params.currency).getAccountInfo(params);
    }

    getServerInfo(params) {
        return this.get(params.currency).getServerInfo(params);
    }
}

