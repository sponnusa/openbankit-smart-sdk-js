"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var StellarWallet = _interopRequire(require("stellar-wallet-js-sdk"));

var _stellarBase = require("stellar-base");

var Account = _stellarBase.Account;
var Keypair = _stellarBase.Keypair;

//TODO: move scrypt params and wallet-server url to a config file

var EncryptedWalletStorage = exports.EncryptedWalletStorage = (function () {
    function EncryptedWalletStorage() {
        _classCallCheck(this, EncryptedWalletStorage);
    }

    _createClass(EncryptedWalletStorage, null, {
        registerWallet: {

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

            value: function registerWallet(server, keypair, username, password, domain) {
                var keychainData = { seed: keypair.seed() };
                return StellarWallet.createWallet({
                    server: server + "/v2",
                    username: username + "@" + domain,
                    password: password,
                    publicKey: keypair.rawPublicKey().toString("base64"),
                    keychainData: JSON.stringify(keychainData),
                    mainData: "mainData",
                    kdfParams: {
                        algorithm: "scrypt",
                        bits: 256,
                        n: Math.pow(2, 11),
                        r: 8,
                        p: 1
                    }
                });
            }
        },
        getWallet: {

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

            value: function getWallet(server, username, password, domain) {
                var params = {
                    server: server + "/v2",
                    username: username.toLowerCase() + "@" + domain,
                    password: password
                };

                return StellarWallet.getWallet(params).then(function (wallet) {
                    console.log("wallet: ", wallet);
                    var keychainData = JSON.parse(wallet.getKeychainData());

                    wallet.keypair = Keypair.fromSeed(keychainData.seed);
                    return wallet;
                });
            }
        }
    });

    return EncryptedWalletStorage;
})();