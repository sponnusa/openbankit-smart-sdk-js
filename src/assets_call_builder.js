import {CallBuilder} from "./call_builder";

export class AssetsCallBuilder extends CallBuilder {
    /**
     * Creates a new {@link AssetsCallBuilder} pointed to server defined by serverUrl.
     *
     * Do not create this object directly, use {@link Server#Assets}.
     * @constructor
     * @extends CallBuilder
     * @param {string} serverUrl Horizon server URL.
     */
    constructor(serverUrl) {
        super(serverUrl);
        this.url.segment('assets');
    }
}
