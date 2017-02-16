import {CallBuilder} from "./call_builder";

export class CommissionCallBuilder extends CallBuilder {

    constructor(serverUrl){
        super(serverUrl);
        this.url.segment('commission');
    }

    /**
     * Returns commission based on operation data
     *
     * @param {string} source - The source of operation for which commission is counted
     * @param {string} destination - The destination account ID.
     * @param {Asset} asset - The asset to send.
     * @param {string} amount - The amount to send.
     */
    calculate(source, destination, asset, amount) {
        this.url.segment('calculate');
        this.url.addQuery('from', source);
        this.url.addQuery('to', destination);
        this.url.addQuery('amount', amount);

        if (!asset.isNative()) {
            this.url.addQuery('asset_type', asset.getAssetType());
            this.url.addQuery('asset_code', asset.getCode());
            this.url.addQuery('asset_issuer', asset.getIssuer());
        } else {
            this.url.addQuery('asset_type', 'native');
        }
        return this;
    }

    /**
     * Returns commissions filtered by accountId
     */
    forAccount(accountId) {
        this.url.addQuery('account_id', accountId);
        return this;
    }

    /**
     * Returns commissions filtered by accountType
     */
    forAccountType(accountType) {
        this.url.addQuery('account_type', accountType);
        return this;
    }

    /**
     * Returns commissions filtered by asset
     */
    forAsset(asset) {
        if (!asset.isNative()) {
            this.url.addQuery('asset_type', asset.getAssetType());
            this.url.addQuery('asset_code', asset.getCode());
            this.url.addQuery('asset_issuer', asset.getIssuer());
        } else {
            this.url.addQuery('asset_type', 'native');
        }
        return this;
    }

}
