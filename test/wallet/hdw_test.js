import * as StellarBase from "stellar-base";
import {testData, badData} from "./test_data";
import BigNumber from 'bignumber.js';

const ONE = 10000000;
let HDWallet = StellarSdk.HDWallet;
let HDKey = StellarBase.HDKey;
let Promise = require("bluebird");

let bankPublicKey = "GAWIB7ETYGSWULO4VB7D6S42YLPGIC7TY7Y2SSJKVOTMQXV5TILYWBUA",
    asset = new StellarSdk.Asset('EUAH', bankPublicKey),
    url = "http://dev.stellar.attic.pw:8010";

function bufferCompare(buf1, buf2) {
    for (let l = 0; l < 31; l++)
        if (buf1[l] !== buf2[l])
            return false;
    
    return true ;
}

function fromAmount(value) {
    return new BigNumber(value).div(ONE).toString();
}
function toAmount(value) {
    return new BigNumber(value).mul(ONE);
}

function checkList(list, constList) {
    for (let i = 0; i < list.length; i++) {
        if ((list[i].key !== constList[i].key) || (fromAmount(list[i].amount) !== constList[i].amount)) {
            console.log(list[i].key, "==", constList[i].key);
            console.log(fromAmount(list[i].amount), "==", constList[i].amount);
            return false;
        }
    }
    return true;
}

function makeResponseList(request) {
    // console.log("check account ", request.length);
    // console.log("-------------------------------");
    let response =
    {
        "assets": [ ]
    };
    
    let result = {
        "asset": {  "asset_type": "credit_alphanum4",
            "asset_code": "EUAH",
            "asset_issuer": "GAWIB7ETYGSWULO4VB7D6S42YLPGIC7TY7Y2SSJKVOTMQXV5TILYWBUA" },
        "balances": []

    }; 
    for (let i = 0; i < request.length; i++) {
        let id = StellarBase.decodeCheck("accountId", request[i]);

        let isValid = (id.readUInt8(0) & 31) === 0,
            hasBalance = (id.readUInt8(1) & 1) > 0,
            balance = 0;

        if (hasBalance)
            balance = (id.readUInt8(0) ^ 5) + 8;

        if (isValid) {
            result.balances.push({
                "account_id": request[i],
                "balance": balance.toString(10),
                "limit": "922337203685.4775807"
            });
        }
    }
    if(result.balances.length !== 0)
       response.assets[0] = result; 
    
    return Promise.resolve(response);
}

describe("HDWallet Positive Test. ", function () {

    describe('Set by Mnemonic: ', function () {
        let phrase = [];
        for (let i = 0; i < 5; i++)
            phrase[i] = testData.phrase[i];
        // phrase[i] = HDKey.getMnemonic();

        beforeEach(function (done) {
            sinon.stub(StellarSdk.Server.prototype, "getBalances", makeResponseList);
            done();
        });

        it("Create random Wallet. ", function (done) {
            this.timeout(300000);
            StellarSdk.HDWallet
                .randomWallet(url)
                .then(hdw => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done()
                })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });
        });

        it("Create random mnemonic phrase. ", function (done) {
            this.timeout(300000);
            let defaultPhrase = StellarSdk.HDWallet.genMnemonicPhrase();
            let engPhrase = StellarSdk.HDWallet.genMnemonicPhrase("eng");
            let ukrPhrase = StellarSdk.HDWallet.genMnemonicPhrase("ukr");

            // expect(HDKey.getSeedFromMnemonic(engPhrase).toString("hex")).to.equal(HDKey.getSeedFromMnemonic(defaultPhrase).toString("hex"));
            // expect(HDKey.getSeedFromMnemonic(ukrPhrase).toString("hex")).to.equal(HDKey.getSeedFromMnemonic(defaultPhrase).toString("hex"));

            StellarSdk.Server.prototype.getBalances.restore();
            done();


        });

        it("Create wallet from mnemonic phrase. ", function (done) {
            this.timeout(300000);
            let phrase = testData.phrase[3];
            StellarSdk.HDWallet
                .setByPhrase(phrase, url, "eng")
                .then(hdw => {
                    let mnemonic = hdw.getMnemonicPhrase("eng");
                    expect(mnemonic).to.equals(phrase);
                    StellarSdk.Server.prototype.getBalances.restore();
                    done()
                })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });

        });

        it("seed in HDW compare with const", function (done) {
            this.timeout(300000);
            let promise = Promise.resolve();

            phrase.forEach(function (mnemonic, i) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            expect(bufferCompare(hdw.seed, new Buffer(testData.seed[i], "hex"))).to.equal(true);
                            return Promise.resolve();
                        });
                };
                promise = promise.then(p)
            });

            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            }).catch(err => {
                StellarSdk.Server.prototype.getBalances.restore();
                done(err)
            });
        });

        it("serialize/deserialize of HDWallet correctly", function (done) {
            this.timeout(300000);
            let promise = Promise.resolve();

            phrase.forEach(function (mnemonic) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            let strOriginal = hdw.serialize();
                            return HDWallet.setByStrKey(strOriginal, url)
                                .then(deserialized => {
                                    let str = deserialized.serialize();
                                    expect(str).to.equal(strOriginal);
                                    return Promise.resolve();
                                });
                        });
                };
                promise = promise.then(p)
            });
            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            }).catch(err => {
                StellarSdk.Server.prototype.getBalances.restore();
                done(err)
            });

        });
        //
        it("Setting indexes and refresh of HDWallet", function (done) {
            this.timeout(300000);
            let promise = Promise.resolve();
            phrase.forEach(function (mnemonic, i) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            let serWallet = hdw.serialize();
                            // console.log(" ");
                            // console.log("before - ", hdw.firstWithMoney, hdw.firstUnused);
                            // console.log("before - ", hdw.indexList);
                            // console.log("before - ", serWallet);
                            // console.log(" ");
                            expect(serWallet).to.equal(testData.serialization[i]);
                            return hdw.refresh();
                        })
                        .then(hdw => {
                            let serWallet = hdw.serialize();
                            // console.log("after - ", hdw.firstWithMoney, hdw.firstUnused);
                            // console.log("after - ", hdw.indexList);
                            // console.log("after  - ", serWallet);
                            expect(serWallet).to.equal(testData.serialization[i]);
                            return Promise.resolve();
                        });
                };
                promise = promise.then(p);
            });

            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            }).catch(err => {
                StellarSdk.Server.prototype.getBalances.restore();
                done(err)
            });
        });
        
        it("make list of keys for account with money", function (done) {
            this.timeout(400000);
            let promise = Promise.resolve();
            phrase.forEach(function (mnemonic, i) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            return hdw.getKeysForAccountsWithMoney() ;
                        })
                        .then(list => {
                            let result = true;
                            for (let l = 0; l < list.length; l++) {
                                if ((list[l].key !== testData.keysList[i][l].key) || (list[l].balances[0].balance !== testData.keysList[i][l].balance)) {
                                    result = false;
                                    break;
                                }
                            }
                            expect(result).to.equal(true);
                            return Promise.resolve();
                        });
                };
                promise = promise.then(p)
            });

            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            }).catch(err => {
                StellarSdk.Server.prototype.getBalances.restore();
                done(err)
            });
        });

        it("make list of IDs of account with money", function (done) {
            this.timeout(400000);
            let promise = Promise.resolve();
            phrase.forEach(function (mnemonic, i) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            return hdw.getAccountIdsWithMoney();
                        })
                        .then(list => {
                            let result = true;
                            // console.log(list, testData.idList[i]);
                            for (let l = 0; l < list.length; l++) {
                                if ((list[l].account_id !== testData.idList[i][l].account_id) || (list[l].balances[0].balance !== testData.idList[i][l].balance)) {
                                    // console.log(list[l].account_id, testData.keysList[i][l].account_id);
                                    result = false;
                                    break;
                                }
                            }
                            expect(result).to.equal(true);
                            return Promise.resolve();
                        });
                };
                promise = promise.then(p)
            });

            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            }).catch(err => {
                StellarSdk.Server.prototype.getBalances.restore();
                done(err)
            });
        });

    });

    describe('HDWallet. SetByStrKey', function () {
        let seed = [],
            mpub = [];
        for (let i = 0; i < 5; i++) {
            seed[i] = new Buffer(testData.seed[i], "hex");
            let hdk = HDKey.fromMasterSeed(seed[i]);
            mpub[i] = hdk.getMasterPub("_");
        }


        beforeEach(function (done) {
            this.timeout(300000);
            // console.log('Before called');
            sinon.stub(StellarSdk.Server.prototype, "getBalances", makeResponseList);
            done();
        });


        it("create HDWallet by seed correctly", function (done) {

            this.timeout(300000);
            let promises = [];

            seed.forEach((currentSeed) => {
                let p =  HDWallet.setByRawSeed(currentSeed, url)
                    .then(hdw => {
                        expect(bufferCompare(hdw.seed, currentSeed)).to.equal(true);
                        return Promise.resolve(true);
                    });
                promises.push(p)
            });

            Promise.all(promises)
                .then(result => {
                    result.forEach(function (value) {
                        if (value !== true)
                            return false;
                    });
                    return true;

                })
                .then(res => {
                    expect(res).to.equal(true);
                    StellarSdk.Server.prototype.getBalances.restore();
                    done();
                })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });
        });

        it("get balance", function (done) {

            this.timeout(300000);
            let promises = [];

            seed.forEach(function(currentSeed, i) {
                let p =  HDWallet.setByRawSeed(currentSeed, url)
                    .then(hdw => {
                        return hdw.getBalance(asset)
                    })
                    .then(balance => {
                        // console.log (balance, i);
                        expect(balance).to.equal(testData.balance[i]);
                        return Promise.resolve(true);
                    });

                promises.push(p)
            });

            Promise.all(promises)
                .then(result => {
                    result.forEach(function (value) {
                        if (value !== true)
                            return false;
                    });
                    return true;

                })
                .then(res => {
                    expect(res).to.equal(true);
                    StellarSdk.Server.prototype.getBalances.restore();
                    done();
                })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });
        });

        it("create HDWallet by mpub correctly", function (done) {
            this.timeout(300000);
            let promises = [];

            mpub.forEach(function (mPublic, i) {
                let p = HDWallet.setByStrKey(mPublic, url)
                    .then(hdw => {
                        let pub = hdw.hdk.getMasterPub("_");
                        expect(pub).to.equal(mpub[i]);
                        return Promise.resolve(true);
                    });

                promises.push(p);

            });

            Promise.all(promises)
                .then(result => {
                    result.forEach(function (value) {
                        expect(value).to.equal(true);
                    });
                    StellarSdk.Server.prototype.getBalances.restore();
                    done();
                })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });
        });


    });
    
    describe("Tx Test. ", function () {

        beforeEach(function (done) {
            // console.log('Before called');
            sinon.stub(StellarSdk.Server.prototype, "getBalances", makeResponseList);
            done();
        });

        it("Making correct Invoice/Withdrawal list", function (done) {
            this.timeout(300000);
            let promise = Promise.resolve();
            let phrase = [];
            for (let i = 0; i < 3; i++)
                phrase[i] = testData.phrase[i + 2];

            testData.tx.phrase.forEach(function (mnemonic, i) {
                let p = () => {
                    return HDWallet.setByPhrase(mnemonic, url)
                        .then(hdw => {
                            let list = hdw.makeInvoiceList(testData.tx.amount[i], asset);
                            let constL = testData.tx.invoice[i];
                            // console.log("invoice ", list);
                            // console.log(listConst.invoice[i]);
                            // console.log(" ");
                            //
                            expect(checkList(list, constL)).to.equal(true);
                            return hdw;
                        })
                        .then(hdw => {
                            // console.log(hdw);
                            return hdw.makeWithdrawalList(toAmount(testData.tx.amount[i]), asset)
                                .then(list => {
                                    let constL = testData.tx.withdrawal[i];
                                    // console.log("withdrawal ", list);
                                    // console.log(listConst.withdrawal[i]);
                                    // console.log(" ");

                                    expect(checkList(list, constL)).to.equal(true);
                                    return Promise.resolve();
                                });
                        })
                        .catch(err => {
                            console.log(err);
                            return Promise.resolve();
                        });
                };
                promise = promise.then(p)
            });

            promise.then(() => {
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            })
                .catch(err => {
                    StellarSdk.Server.prototype.getBalances.restore();
                    done(err)
                });
        });

    });

});

describe("HDWallet. Error handling test. ", function () {

    describe("Invalid mnemonic: ", function () {
        it("wrong words in phrase", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByPhrase(badData.phrase[0], url)
            }).catch(error => {
                    // console.log(error.message);
                    expect(error.message).to.equal("Invalid mnemonic phrase");
                    done()
                });
        });

        it("incorrect string", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByPhrase(badData.phrase[2], url)
            }).catch(error => {
                    // console.log(error.message);
                    expect(error.message).to.equal("Invalid mnemonic phrase");
                    done()
                });
        });
    });

    describe("Invalid strKey: ", function () {
        it("invalid version", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByStrKey(badData.strKey[0], url);
            }).catch(error => {
                    // console.log(error.message);
                    expect(error.message).to.equal("Invalid version of StrKey");
                    done()
                });
        });

        it("invalid checksum", function (done) {
            this.timeout(20000);
            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByStrKey(badData.strKey[1], url)
            }).catch(error => {
                    // console.log(error.message);
                    expect(error.message).to.equal("invalid checksum");
                    done()
                });
        });

        it("invalid masterPublic", function (done) {
            this.timeout(20000);
            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByStrKey("PCZABULJ37QO3GA63QXSFHTFIJRSC6LCS27H3VKKM6OH7FGQIFCZAUT6IUAW76CDIK7F53PKO343F6AKEK2TGFD3GJ5Q", url)
            }).then(hdw => {
                console.log(hdw);
                done()
            }).catch(error => {
                // console.log(error.message);
                expect(error.message).to.equal("invalid encoded string");
                done()
            });
        });

        // let wrPub = StellarBase.HDKey.random().publicKey;
        // let wrChain = StellarBase.HDKey.random().publicKey;
        // let f = new Buffer(54);
        // wrChain.copy(f, 0);
        // wrPub.copy(f, 32);
        // let mpub = StellarBase.encodeCheck("mpub", f);
        // console.log(f.length, mpub);

    });

    describe("Invalid serialized wallet: ", function () {
        it("incorrect version", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByStrKey(badData.wallet[0], url)
            }).then(hdw => {
                console.log(hdw);
                done()
            }).catch(error => {
                    // console.log(error.message);
                    expect(error.message).to.equal("invalid encoded string");
                    done()
                });
        });

    });

    describe("Invalid amount: ", function () {
        beforeEach(function (done) {
            sinon.stub(StellarSdk.Server.prototype, "getBalances", makeResponseList);
            done();
        });

        it("wrong invoice amount", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByPhrase(testData.phrase[0], url) //205 max balance
            }).then(hdw => {

                let res = 0;
                try {
                    hdw.makeInvoiceList(205);
                }
                catch (err) {
                    res = res + 1;
                }
                try {
                    hdw.makeInvoiceList(-205);
                }
                catch (err) {
                    res = res + 1;
                }
                try {
                    hdw.makeInvoiceList("205wd");
                }
                catch (err) {
                    res = res + 1;
                }
                try {
                    hdw.makeInvoiceList("-205");
                }
                catch (err) {
                    res = res + 1;
                }
                expect(res).to.equal(4);
                StellarSdk.Server.prototype.getBalances.restore();
                done();
            }).catch(error => {
                console.log(error.message);

                StellarSdk.Server.prototype.getBalances.restore();
                done()
            });
        });

        it("too big invoice", function (done) {
            this.timeout(20000);

            let promise = Promise.resolve();
            promise.then(() => {
                return HDWallet.setByPhrase(testData.phrase[0], url); //205 max balance
            }).then(hdw => {
                let invoice = hdw.makeInvoiceList("500");
                return hdw.createTx(invoice, asset);
            }).catch(error => {
                // console.log(error.message);
                expect(error.message).to.equal("Not enough money!");
                StellarSdk.Server.prototype.getBalances.restore();
                done()
            });
        });

    });
});
