// import * as promptly from 'promptly';
// import * as util from 'util';
import * as http from "http";
import * as https from "https";
// import { ThoughtRpcClient } from '../../../thoughtd-rpc/lib';
import { IRpcClientOptions } from '../../../thoughtd-rpc/lib/types';
import { THTRPC } from './ThtRpc';

export class ThoughtRPC extends THTRPC {

    //TODO: write a constructor to take opts as an argument
    args: { protocol: typeof http | typeof https; };
    // httpOptions: { rejectUnauthorized: boolean; };

    constructor(opts: IRpcClientOptions) {
        super(opts);
        this.host = opts.host || '127.0.0.1';
        this.port = opts.port || 10617;
        this.user = opts.user || 'user';
        this.pass = opts.pass || 'pass';
        this.auth = `${this.user}:${this.pass}`;
        this.protocol = opts.protocol === 'http' ? http : https || https;
        this.batchedCalls = null;
        this.disableAgent = opts.disableAgent || false;
        this.rejectUnauthorized = opts.rejectUnauthorized || true;
        this.args = { protocol: this.protocol }; // to allow nodes without ssl (protocol: 'http')
    }

    // ThoughtRpcClient.call(this, args);

    // cmdlineUnlock(timeout, callback) {

    //     // TODO: write the functions for rpc calls directly, acctually this is already written in in THTRPC class
    //     this.getWalletInfo(function (err, result) {
    //         if (err) {
    //             console.error(err);
    //             return callback(err);
    //         }
    //         if ('unlocked_until' in result.result) {
    //             if (result['unlocked_until']) {
    //                 throw new Error('wallet is currently unlocked');
    //             }
    //             promptly.password('> ', function (err, phrase) {
    //                 if (err) {
    //                     return callback(err);
    //                 }
    //                 this.walletPassPhrase(phrase, timeout, function (err) {
    //                     if (err) {
    //                         return callback(err);
    //                     } else {
    //                         console.warn('wallet unlocked for ' + timeout + ' seconds');
    //                         return callback(null, function (doneLocking) {
    //                             this.walletLock(function (err) {
    //                                 if (err) {
    //                                     console.error(err.message);
    //                                 } else {
    //                                     console.error('wallet locked');
    //                                 }
    //                                 doneLocking && doneLocking();
    //                             });
    //                         });
    //                     }
    //                 });
    //             });
    //         } else {
    //             process.nextTick(function () {
    //                 callback(null, function (doneLocking) {
    //                     if (doneLocking) {
    //                         process.nextTick(doneLocking);
    //                     }
    //                 });
    //             });
    //         }
    //     });
    // };

}



