import {CallBuilder} from "./call_builder";

export class AccountTraitsCallBuilder extends CallBuilder {
    /**
     * Creates a new {@link AccountTraitsCallBuilder} pointed to server defined by serverUrl.
     *
     * Do not create this object directly, use {@link Server#accountTraits}.
     * @constructor
     * @extends CallBuilder
     * @param {string} serverUrl Horizon server URL.
     */
    constructor(serverUrl) {
        super(serverUrl);
        this.url.segment('traits');
    }

    /**
     * This endpoint responds with a Account traits specivied for account.
     * @param {string} accountId For example: `GDGQVOKHW4VEJRU2TETD6DBRKEO5ERCNF353LW5WBFW3JJWQ2BRQ6KDD`
     * @returns {AccountTraitsCallBuilder}
     */
    forAccount(accountId) {
        this.filter.push(['accounts', accountId, 'traits']);
        return this;
    }
}
