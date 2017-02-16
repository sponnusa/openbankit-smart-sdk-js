import StellarWallet from 'stellar-wallet-js-sdk';
import {Account, Keypair} from 'stellar-base';

//TODO: move scrypt params and wallet-server url to a config file

export class EncryptedWalletStorage {

    /**
    * Store encrypted on the wallet-server.
    *
    * @param {string} server Wallet-server's address.
    * @param {string} username
    * @param {string} password
    * @param {Keypair} keypair
    * @param {string} domain User's domain.
    *
    * @returns {Wallet}
    */
    static registerWallet(server, keypair, username, password, domain) {
        let keychainData = {"seed": keypair.seed()};
        return StellarWallet.createWallet({
            server: server  + '/v2',
            username: username + "@" + domain,
            password: password,
            publicKey: keypair.rawPublicKey().toString('base64'),
            keychainData: JSON.stringify(keychainData),
            mainData: 'mainData',
            kdfParams: {
                algorithm: 'scrypt',
                bits: 256,
                n: Math.pow(2,11),
                r: 8,
                p: 1
            }
        });
    }

    /**
   * Gets wallet from the wallet-server.
   *
   * @param {string} server Wallet-server's address.
   * @param {string} username
   * @param {string} password
   * @param {string} domain User's domain.
   *
   * @returns {Wallet}
   */
    static getWallet(server, username, password, domain) {
        let params = {
            server: server + '/v2',
            username: username.toLowerCase() + "@" + domain,
            password: password
        };

        return StellarWallet.getWallet(params)
            .then(wallet => {
                console.log("wallet: ", wallet);
                let keychainData = JSON.parse(wallet.getKeychainData());

                wallet.keypair = Keypair.fromSeed(keychainData.seed);
                return wallet;
            });
    }

}
