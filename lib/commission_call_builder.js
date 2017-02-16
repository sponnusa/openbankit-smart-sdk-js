"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var CallBuilder = require("./call_builder").CallBuilder;

var CommissionCallBuilder = exports.CommissionCallBuilder = (function (_CallBuilder) {
    function CommissionCallBuilder(serverUrl) {
        _classCallCheck(this, CommissionCallBuilder);

        _get(Object.getPrototypeOf(CommissionCallBuilder.prototype), "constructor", this).call(this, serverUrl);
        this.url.segment("commission");
    }

    _inherits(CommissionCallBuilder, _CallBuilder);

    _createClass(CommissionCallBuilder, {
        calculate: {

            /**
             * Returns commission based on operation data
             *
             * @param {string} source - The source of operation for which commission is counted
             * @param {string} destination - The destination account ID.
             * @param {Asset} asset - The asset to send.
             * @param {string} amount - The amount to send.
             */

            value: function calculate(source, destination, asset, amount) {
                this.url.segment("calculate");
                this.url.addQuery("from", source);
                this.url.addQuery("to", destination);
                this.url.addQuery("amount", amount);

                if (!asset.isNative()) {
                    this.url.addQuery("asset_type", asset.getAssetType());
                    this.url.addQuery("asset_code", asset.getCode());
                    this.url.addQuery("asset_issuer", asset.getIssuer());
                } else {
                    this.url.addQuery("asset_type", "native");
                }
                return this;
            }
        },
        forAccount: {

            /**
             * Returns commissions filtered by accountId
             */

            value: function forAccount(accountId) {
                this.url.addQuery("account_id", accountId);
                return this;
            }
        },
        forAccountType: {

            /**
             * Returns commissions filtered by accountType
             */

            value: function forAccountType(accountType) {
                this.url.addQuery("account_type", accountType);
                return this;
            }
        },
        forAsset: {

            /**
             * Returns commissions filtered by asset
             */

            value: function forAsset(asset) {
                if (!asset.isNative()) {
                    this.url.addQuery("asset_type", asset.getAssetType());
                    this.url.addQuery("asset_code", asset.getCode());
                    this.url.addQuery("asset_issuer", asset.getIssuer());
                } else {
                    this.url.addQuery("asset_type", "native");
                }
                return this;
            }
        }
    });

    return CommissionCallBuilder;
})(CallBuilder);