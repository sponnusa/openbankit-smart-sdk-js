require('es6-promise').polyfill();

// stellar-sdk classes to expose
export * from "./errors";
export {Server} from "./server";
//export {HDWallet} from "./hdwallet";
export {FederationServer} from "./federation_server";
export {EncryptedWalletStorage} from "./wallet";

// expose classes and functions from stellar-base
export * from "stellar-base";

export default module.exports;
