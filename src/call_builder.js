import {NotFoundError, NetworkError, BadRequestError} from "./errors";
import forEach from 'lodash/forEach';

let URI = require("urijs");
let URITemplate = require("urijs").URITemplate;

let axios = require("axios");
var EventSource = (typeof window === 'undefined') ? require('eventsource') : window.EventSource;
let toBluebird = require("bluebird").resolve;

var response_interval = 10;
var stopping = false;

/**
 * Creates a new {@link CallBuilder} pointed to server defined by serverUrl.
 *
 * This is an **abstract** class. Do not create this object directly, use {@link Server} class.
 * @param {string} serverUrl
 * @class CallBuilder
 */
export class CallBuilder {
  constructor(serverUrl) {
    this.url = serverUrl;
    this.filter = [];
  }

  /**
   * @private
   */
  checkFilter() {
    if (this.filter.length >= 2) {
      throw new BadRequestError("Too many filters specified", this.filter);
    }
    if (this.filter.length === 1) {
      this.url.segment(this.filter[0]);
    }
  }

  /**
   * Triggers a HTTP request using this builder's current configuration.
   * Returns a Promise that resolves to the server's response.
   * @returns {Promise}
   */
  call() {
    this.checkFilter();
    return this._sendNormalRequest(this.url)
      .then(r => this._parseResponse(r));
  }

  /**
   * Creates an EventSource that listens for incoming messages from the server.
   * @see [Horizon Response Format](https://www.stellar.org/developers/horizon/learn/responses.html)
   * @see [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
   * @param {object} [options] EventSource options.
   * @param {function} [options.onmessage] Callback function to handle incoming messages.
   * @param {function} [options.onerror] Callback function to handle errors.
   * @returns {EventSource}
   */
  stream(options) {
    var context = this;

    this.checkFilter();

    // Workaround for streaming with NOW cursor after network breakdown
    return new Promise(function (resolve, reject) {
      if (!context.url.hasQuery('cursor', 'now')) {
        resolve();
      }

      resolve(context._sendNormalRequest(context.url)
        .then(r => {
            var uri = new URI(r._links.self.href);
            if (typeof uri.search(true).cursor != 'undefined') {
              context.url.setQuery('cursor', uri.search(true).cursor);
            }
        }));
      })
      .then(() => {
        context._eventStreamConnect(options);
      });
  }

  _eventStreamConnect(options) {
    var context = this;

    // Workaround to check dead connection or network issues among different eventsource implementations
    var last_msg_ts = Math.floor(Date.now() / 1000);
    var es = new EventSource(this.url.toString());
    var stopStream;

    // Check message intervals
    var checkInterval = function () {
      if (stopping) {
        return;
      }

      if (Math.floor(Date.now() / 1000) - last_msg_ts > response_interval) {
        es.close();
        context._eventStreamConnect(options);
        return;
      }

      setTimeout(checkInterval, 1000);
    };

    stopStream = function() {
      stopping = true;
      es.close();
    };

    es.onmessage = (message) => {
      last_msg_ts = Math.floor(Date.now() / 1000);
      var result = message.data ? this._parseRecord(JSON.parse(message.data)) : message;

      // Update the paging token for next request
      if (typeof result == 'object' && result.paging_token) {
        context.url.setQuery('cursor', result.paging_token);
      }

      options.onmessage(result);
    };

    es.onerror = options.onerror;

    if (typeof options.onopen === 'function') {
      es.onopen = (e) => {
        options.onopen(stopStream);
      };
    }

    checkInterval();
  }

  /**
   * @private
   */
  _requestFnForLink(link) {
    return opts => {
      let uri;

      if (link.templated) {
        let template = URITemplate(link.href);
        let expOpts = opts === undefined || null === opts ? {} : opts;
        uri = URI(template.expand(expOpts));
      } else {
        uri = URI(link.href);
      }

      return this._sendNormalRequest(uri).then(r => this._parseRecord(r));
    };
  }

  /**
   * Convert each link into a function on the response object.
   * @private
   */
  _parseRecord(json) {
    if (!json._links) {
      return json;
    }
    forEach(json._links, (n, key) => {json[key] = this._requestFnForLink(n);});
    return json;
  }

  _sendNormalRequest(url) {
    if (url.authority() === '') {
      url = url.authority(this.url.authority());
    }

    if (url.protocol() === '') {
      url = url.protocol(this.url.protocol());
    }

    // Temp fix for: https://github.com/stellar/js-stellar-sdk/issues/15
    url.addQuery('c', Math.random());
    var promise = axios.get(url.toString())
      .then(response => response.data)
      .catch(this._handleNetworkError);
    return toBluebird(promise);
  }

  /**
   * @private
   */
  _parseResponse(json) {
    if (json._embedded && json._embedded.records) {
      return this._toCollectionPage(json);
    } else {
      return this._parseRecord(json);
    }
  }

  /**
   * @private
   */
  _toCollectionPage(json) {
    for (var i = 0; i < json._embedded.records.length; i++) {
      json._embedded.records[i] = this._parseRecord(json._embedded.records[i]);
    }
    return {
      records: json._embedded.records,
      next: () => {
        return this._sendNormalRequest(URI(json._links.next.href))
          .then(r => this._toCollectionPage(r));
      },
      prev: () => {
        return this._sendNormalRequest(URI(json._links.prev.href))
          .then(r => this._toCollectionPage(r));
      }
    };
  }

  /**
   * @private
   */
  _handleNetworkError(response) {
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

  /**
   * Adds `cursor` parameter to the current call. Returns the CallBuilder object on which this method has been called.
   * @see [Paging](https://www.stellar.org/developers/horizon/learn/paging.html)
   * @param {string} cursor A cursor is a value that points to a specific location in a collection of resources.
   */
  cursor(cursor) {
    this.url.addQuery("cursor", cursor);
    return this;
  }

  /**
   * Adds `limit` parameter to the current call. Returns the CallBuilder object on which this method has been called.
   * @see [Paging](https://www.stellar.org/developers/horizon/learn/paging.html)
   * @param {number} number Number of records the server should return.
   */
  limit(number) {
    this.url.addQuery("limit", number);
    return this;
  }

  /**
   * Adds `order` parameter to the current call. Returns the CallBuilder object on which this method has been called.
   * @param {"asc"|"desc"} direction
   */
  order(direction) {
    this.url.addQuery("order", direction);
    return this;
  }


}
