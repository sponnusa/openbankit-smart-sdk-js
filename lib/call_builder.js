"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _errors = require("./errors");

var NotFoundError = _errors.NotFoundError;
var NetworkError = _errors.NetworkError;
var BadRequestError = _errors.BadRequestError;

var forEach = _interopRequire(require("lodash/forEach"));

var URI = require("urijs");
var URITemplate = require("urijs").URITemplate;

var axios = require("axios");
var EventSource = typeof window === "undefined" ? require("eventsource") : window.EventSource;
var toBluebird = require("bluebird").resolve;

var response_interval = 10;
var stopping = false;

/**
 * Creates a new {@link CallBuilder} pointed to server defined by serverUrl.
 *
 * This is an **abstract** class. Do not create this object directly, use {@link Server} class.
 * @param {string} serverUrl
 * @class CallBuilder
 */

var CallBuilder = exports.CallBuilder = (function () {
  function CallBuilder(serverUrl) {
    _classCallCheck(this, CallBuilder);

    this.url = serverUrl;
    this.filter = [];
  }

  _createClass(CallBuilder, {
    checkFilter: {

      /**
       * @private
       */

      value: function checkFilter() {
        if (this.filter.length >= 2) {
          throw new BadRequestError("Too many filters specified", this.filter);
        }
        if (this.filter.length === 1) {
          this.url.segment(this.filter[0]);
        }
      }
    },
    call: {

      /**
       * Triggers a HTTP request using this builder's current configuration.
       * Returns a Promise that resolves to the server's response.
       * @returns {Promise}
       */

      value: function call() {
        var _this = this;

        this.checkFilter();
        return this._sendNormalRequest(this.url).then(function (r) {
          return _this._parseResponse(r);
        });
      }
    },
    stream: {

      /**
       * Creates an EventSource that listens for incoming messages from the server.
       * @see [Horizon Response Format](https://www.stellar.org/developers/horizon/learn/responses.html)
       * @see [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
       * @param {object} [options] EventSource options.
       * @param {function} [options.onmessage] Callback function to handle incoming messages.
       * @param {function} [options.onerror] Callback function to handle errors.
       * @returns {EventSource}
       */

      value: function stream(options) {
        var context = this;

        this.checkFilter();

        // Workaround for streaming with NOW cursor after network breakdown
        return new Promise(function (resolve, reject) {
          if (!context.url.hasQuery("cursor", "now")) {
            resolve();
          }

          resolve(context._sendNormalRequest(context.url).then(function (r) {
            var uri = new URI(r._links.self.href);
            if (typeof uri.search(true).cursor != "undefined") {
              context.url.setQuery("cursor", uri.search(true).cursor);
            }
          }));
        }).then(function () {
          context._eventStreamConnect(options);
        });
      }
    },
    _eventStreamConnect: {
      value: function _eventStreamConnect(options) {
        var _this = this;

        var context = this;

        // Workaround to check dead connection or network issues among different eventsource implementations
        var last_msg_ts = Math.floor(Date.now() / 1000);
        var es = new EventSource(this.url.toString());
        var stopStream;

        // Check message intervals
        var checkInterval = (function (_checkInterval) {
          var _checkIntervalWrapper = function checkInterval() {
            return _checkInterval.apply(this, arguments);
          };

          _checkIntervalWrapper.toString = function () {
            return _checkInterval.toString();
          };

          return _checkIntervalWrapper;
        })(function () {
          if (stopping) {
            return;
          }

          if (Math.floor(Date.now() / 1000) - last_msg_ts > response_interval) {
            es.close();
            context._eventStreamConnect(options);
            return;
          }

          setTimeout(checkInterval, 1000);
        });

        stopStream = function () {
          stopping = true;
          es.close();
        };

        es.onmessage = function (message) {
          last_msg_ts = Math.floor(Date.now() / 1000);
          var result = message.data ? _this._parseRecord(JSON.parse(message.data)) : message;

          // Update the paging token for next request
          if (typeof result == "object" && result.paging_token) {
            context.url.setQuery("cursor", result.paging_token);
          }

          options.onmessage(result);
        };

        es.onerror = options.onerror;

        if (typeof options.onopen === "function") {
          es.onopen = function (e) {
            options.onopen(stopStream);
          };
        }

        checkInterval();
      }
    },
    _requestFnForLink: {

      /**
       * @private
       */

      value: function _requestFnForLink(link) {
        var _this = this;

        return function (opts) {
          var uri = undefined;

          if (link.templated) {
            var template = URITemplate(link.href);
            var expOpts = opts === undefined || null === opts ? {} : opts;
            uri = URI(template.expand(expOpts));
          } else {
            uri = URI(link.href);
          }

          return _this._sendNormalRequest(uri).then(function (r) {
            return _this._parseRecord(r);
          });
        };
      }
    },
    _parseRecord: {

      /**
       * Convert each link into a function on the response object.
       * @private
       */

      value: function _parseRecord(json) {
        var _this = this;

        if (!json._links) {
          return json;
        }
        forEach(json._links, function (n, key) {
          json[key] = _this._requestFnForLink(n);
        });
        return json;
      }
    },
    _sendNormalRequest: {
      value: function _sendNormalRequest(url) {
        if (url.authority() === "") {
          url = url.authority(this.url.authority());
        }

        if (url.protocol() === "") {
          url = url.protocol(this.url.protocol());
        }

        // Temp fix for: https://github.com/stellar/js-stellar-sdk/issues/15
        url.addQuery("c", Math.random());
        var promise = axios.get(url.toString()).then(function (response) {
          return response.data;
        })["catch"](this._handleNetworkError);
        return toBluebird(promise);
      }
    },
    _parseResponse: {

      /**
       * @private
       */

      value: function _parseResponse(json) {
        if (json._embedded && json._embedded.records) {
          return this._toCollectionPage(json);
        } else {
          return this._parseRecord(json);
        }
      }
    },
    _toCollectionPage: {

      /**
       * @private
       */

      value: function _toCollectionPage(json) {
        var _this = this;

        for (var i = 0; i < json._embedded.records.length; i++) {
          json._embedded.records[i] = this._parseRecord(json._embedded.records[i]);
        }
        return {
          records: json._embedded.records,
          next: function () {
            return _this._sendNormalRequest(URI(json._links.next.href)).then(function (r) {
              return _this._toCollectionPage(r);
            });
          },
          prev: function () {
            return _this._sendNormalRequest(URI(json._links.prev.href)).then(function (r) {
              return _this._toCollectionPage(r);
            });
          }
        };
      }
    },
    _handleNetworkError: {

      /**
       * @private
       */

      value: function _handleNetworkError(response) {
        if (response instanceof Error) {
          return Promise.reject(response);
        } else {
          switch (response.status) {
            case 404:
              return Promise.reject(new NotFoundError(response.data, response));
            default:
              return Promise.reject(new NetworkError(response.status, response));
          }
        }
      }
    },
    cursor: {

      /**
       * Adds `cursor` parameter to the current call. Returns the CallBuilder object on which this method has been called.
       * @see [Paging](https://www.stellar.org/developers/horizon/learn/paging.html)
       * @param {string} cursor A cursor is a value that points to a specific location in a collection of resources.
       */

      value: (function (_cursor) {
        var _cursorWrapper = function cursor(_x) {
          return _cursor.apply(this, arguments);
        };

        _cursorWrapper.toString = function () {
          return _cursor.toString();
        };

        return _cursorWrapper;
      })(function (cursor) {
        this.url.addQuery("cursor", cursor);
        return this;
      })
    },
    limit: {

      /**
       * Adds `limit` parameter to the current call. Returns the CallBuilder object on which this method has been called.
       * @see [Paging](https://www.stellar.org/developers/horizon/learn/paging.html)
       * @param {number} number Number of records the server should return.
       */

      value: function limit(number) {
        this.url.addQuery("limit", number);
        return this;
      }
    },
    order: {

      /**
       * Adds `order` parameter to the current call. Returns the CallBuilder object on which this method has been called.
       * @param {"asc"|"desc"} direction
       */

      value: function order(direction) {
        this.url.addQuery("order", direction);
        return this;
      }
    }
  });

  return CallBuilder;
})();