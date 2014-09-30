;(function(window) { 'use strict';

/**
 * @function
 * @name isArray
 * @private
 *
 * @description
 * Test if a given value is an Array. If Array.isArray is supported, it's possible to test if
 * a value from a different sandbox is an array, but this should not be depended on. The native
 * implementation is primarily deferred to for performance reasons, and nothing else.
 *
 * @param {*} arr value to test if it is an array.
 *
 * @returns {boolean} true if the value is an array, otherwise false.
 */
var isArray = (function() {
  if (typeof Array.isArray === 'function') {
    return Array.isArray;
  }
  return function(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };
})();


/**
 * @function
 * @name isFile
 * @private
 *
 * @description
 * Returns true if value.toString() results in [object File]. It is possible to get false positives
 * this way, but unlikely.
 *
 * @param {object} obj value to test if it is a File object.
 *
 * @returns {boolean} true if the value is determined to be a File, otherwise false.
 */
function isFile(obj) {
  return obj && Object.prototype.toString.call(obj) === '[object File]';
}

var BLOB_REGEXP = /^\[object (Blob|File)\]$/;


/**
 * @function
 * @name isBlob
 * @private
 *
 * @description
 * Returns true if value.toString() results in [object File] or [object Blob]. It is possible to
 * get false positives this way, but unlikely.
 *
 * Since this would also detect File objects, one should be careful when using this.
 *
 * @param {object} obj value to test if it is a File object.
 *
 * @returns {boolean} true if the value is determined to be a File or Blob, otherwise false.
 */
function isBlob(obj) {
  return obj && BLOB_REGEXP.test(Object.prototype.toString.call(obj));
}

var ERROR = {};

var DEFAULT_HTTP = {
};

function NativePromiseWrapper(resolve, reject) {
  return new window.Promise(resolve, reject);
}

/**
 * @class InboxAPI
 *
 * @description
 * Class which represents a specific Inbox web service. From here, it's possible to query for and
 * construct InboxNamespace objects, which represent email addresses associated with an account.
 *
 * @param {object|string} optionsOrAppId An object containing configuration kes, or alternatively
 *   a string containing the appId for communicating with the webservice.
 *
 * @param {string=} optionalBaseUrl A string containing the base URL for the Inbox web service. If
 *   the optionsOrAppId parameter is an object, then this field is not necessary. If not specified,
 *   the baseUrl will be 'http://api.inboxapp.co/'
 *
 * @param {function=} optionalPromiseConstructor A function which, when called, returns an instance
 *   of an ES6-compatible Promise. If unspecified, window.Promise is used. Note that the Promise
 *   constructor must be callable without `new`, so for non-native Promises, one should specify a
 *   wrapper which constructs the associated promise.
 *
 * @throws {TypeError} The InboxAPI constructor will throw under the circumstances that we have
 *   no appId, no Promise implementation, or if any of the configuration parameters are not of
 *   the appropriate type.
 */
function InboxAPI(optionsOrAppId, optionalBaseUrl, optionalPromiseConstructor) {
  var options;
  var len;
  var args = arguments;

  if (optionsOrAppId && typeof optionsOrAppId === 'object') {
    options = optionsOrAppId;
  } else {
    options = {};
    len = Math.min(args.length, 3) - 1;
    options.promise = typeof args[len] === 'function' ? args[len--] : window.Promise;
    options.baseUrl = len ?
      ((typeof args[len--] === 'string' || args[len + 1] == null) ? args[len + 1] : ERROR) :
      null;
    options.appId = args[len];
  }

  if (options.appId == null) {
    throw new TypeError('Unable to construct `InboxAPI`: missing `appId`.');
  } else if (typeof options.appId !== 'string') {
    throw new TypeError('Unable to construct `InboxAPI`: option `appId` must be a string.');
  }

  if (options.baseUrl == null) {
    options.baseUrl = 'http://api.inboxapp.co/';
  } else if (typeof options.baseUrl !== 'string') {
    throw new TypeError('Unable to construct `InboxAPI`: option `baseUrl` must be a string.');
  }

  if (options.promise == null) {
    options.promise = window.Promise;
  }

  if (options.promise == null) {
    throw new TypeError('Unable to construct `InboxAPI`: missing option `promise`, ' +
                        'or no native Promise available');
  } else if (typeof options.promise !== 'function') {
    throw new TypeError('Unable to construct `InboxAPI`: option `promise` must be a ' +
                        'function which returns an ECMAScript6-compatible Promise');
  }

  if (options.promise === window.Promise) {
    options.promise = NativePromiseWrapper;
  }

  if (!(this instanceof InboxAPI)) {
    return new InboxAPI(options);
  }

  var cache = INStubCache;

  if (options.cache) {
    if (!INCache.isRegistered(options.cache)) {
      throw new TypeError('Cache ' + options.cache + ' is not registered.');
    } else if (typeof options.cache === 'string') {
      cache = getCacheByName(options.cache);
    } else {
      cache = options.cache;
    }
  }

  if (typeof cache === 'function') {
    options.cache = new cache(this, options.cacheId);
  } else if (typeof cache === 'object' && cache) {
    options.cache = cache;
  }

  options.http = merge(merge({}, DEFAULT_HTTP), (typeof options.http === 'object' && options.http));

  this._ = options;
  defineProperty(this, '_', INVISIBLE);
}

/**
 * @function
 * @name InboxAPI#http
 *
 * @description
 * Return or modify InboxAPI instance's HTTP configuration. If called with no arguments, it will
 * return the HTTP configuration object. Otherwise, if passed a key, it will return the
 * configuration for that key (case-sensitive). Finally, if there is a value, the key will be
 * updated with that value, and the InboxAPI will be returned.
 *
 * @param {string=} key The optional key in the configuration object
 *
 * @param {*=} value The value which, if specified, will be assigned to property `key` in the
 *   configuration.
 *
 * @returns {*} Either the InboxAPI instance, the HTTP configuration, or the value of a key in
 *   the HTTP configuration.
 */
InboxAPI.prototype.http = function(key, value) {
  if (!this._.http || typeof this._.http !== 'object') {
    this._.http = merge({}, DEFAULT_HTTP);
  }

  if (!arguments.length) {
    return this._.http;
  } else if (arguments.length === 1) {
    return this._.http[key];
  } else if (arguments.length > 1) {
    this._.http[key] = value;
  }
  return this;
};

/**
 * @function
 * @name InboxAPI#withCredentials
 *
 * @description
 * Convenience method for querying InboxAPI#http('withCredentials'), returning either the current
 * value of `withCredentials`, or specifying a new value.
 *
 * @param {boolean=} value Boolean value to assign to the withCredentials configuration.
 *
 * @returns {*} Either the InboxAPI instance, or the value of `withCredentials` in the HTTP
 *   configuration.
 */
InboxAPI.prototype.withCredentials = function(value) {
  if (!arguments.length) {
    return !!this.http('withCredentials');
  } else {
    return this.http('withCredentials', !!value);
  }
};

var HEADER_REGEXP = /^[a-z0-9_-]+$/;

/**
 * @function
 * @name InboxAPI#setRequestHeader
 *
 * @description
 * Convenience method for specifying request headers to be issued by HTTP requests to the web
 * service. Primarily useful for certain authentication strategies.
 *
 * @param {string} header The header name to query. This value should be a string, and will be
 *   converted to lower-case. Non-lower-cased header names should not be specified manually.
 *
 * @param {*} value The value to assign to a header. If the value is a function, it will be
 *   invoked during a request, and the return value will be used as the header value.
 *
 * @returns {InboxAPI} The InboxAPI instance.
 *
 * @throws {TypeError} setRequestHeader will throw if either a header name is bad (not made up of
 *   ASCII letters, numbers, underscores and hyphens exclusively) or if there are fewer than two
 *   arguments passed into the function.
 */
InboxAPI.prototype.setRequestHeader = function(header, value) {
  if (arguments.length < 2) {
    throw new TypeError('Cannot invoke `setRequestHeader` on `InboxAPI`: header name and value ' +
      'are required.');
  }

  var http = this.http();
  if (!http.headers || typeof http.headers !== 'object') {
    http.headers = {};
  }

  header = ('' + header).toLowerCase();
  if (!HEADER_REGEXP.test(header)) {
    throw new TypeError('Cannot invoke `setRequestHeader` on `InboxAPI`: Bad header name "' +
      header + '".');
  }

  http.headers[header] = value;

  return this;
};

/**
 * @function
 * @name InboxAPI#forEachRequestHeader
 * @private
 *
 * @description
 * Convenience method for iterating over each request header and calling a function with the
 * header name and value. Only header names which are considered to be appropriate will be
 * used, and if they happen to be functions, the return value of the function is used rather than
 * the function itself.
 *
 * param {Function} fn The callback to be called for each iterated header and value.
 *
 * param {Object|Function} thisArg Value to use as `this` when invoking the callback.
 *
 * returns {InboxAPI} The InboxAPI instance.
 */
InboxAPI.prototype.forEachRequestHeader = function(fn, thisArg) {
  if (!thisArg || typeof thisArg !== 'object' && typeof thisArg !== 'function') {
    thisArg = null;
  }

  var headers = this.http('headers');
  var key;
  var value;
  if (!headers || typeof headers !== 'object') {
    return;
  }

  for (key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && HEADER_REGEXP.test(key)) {
      value = headers[key];
      if (typeof value === 'function') {
        value = value();
      }

      fn.call(thisArg, key, value);
    }
  }

  return this;
};


/**
 * @function
 * @name InboxAPI#promise
 * @private
 *
 * @description
 * Helper for constructing a Promise object using the configured promise constructor.
 *
 * @param {function(function, function)} resolver Callback function which performs a task and
 *   fulfills the constructed promise.
 *
 * @returns {Promise} the constructed promise.
 */
defineProperty(InboxAPI.prototype, 'promise', INVISIBLE, null, null, function(resolver) {
  return this._.promise(resolver);
});


/**
 * @function
 * @name InboxAPI#baseUrl
 *
 * @description
 * Getter for the configured base-url of the InboxAPI instance.
 *
 * @returns {string} The configured base URL for API requests.
 */
InboxAPI.prototype.baseUrl = function() {
  return this._.baseUrl;
};


/**
 * @function
 * @name InboxAPI#appId
 *
 * @description
 * Getter for the configured App ID of the InboxAPI instance.
 *
 * @returns {string} The configured App ID.
 */
InboxAPI.prototype.appId = function() {
  return this._.appId;
};


/**
 * @function
 * @name InboxAPI#namespace
 *
 * @description
 * Request a namespace by ID. This method will consult the cache before making an HTTP request.
 *
 * @param {string} namespaceId The ID of the namespace to query for.
 *
 * @returns {Promise} a promise which is resolved with an INNamespace object, or else rejected
 *   with an error of some kind. The error may be from the cache subsystem, or may an HTTP
 *   response with an erroneous status code.
 */
InboxAPI.prototype.namespace = function(namespaceId) {
  var self = this;
  var cache = this._.cache;
  if (!arguments.length) {
    throw new TypeError(
      'Unable to perform `namespace()` on InboxAPI: missing option `namespaceId`.');
  } else if (typeof namespaceId !== 'string') {
    throw new TypeError(
      'Unable to perform `namespace()` on InboxAPI: namespaceId must be a string.');
  }
  return this.promise(function(resolve, reject) {
    cache.get(namespaceId, function(err, obj) {
      if (err) return reject(err);
      if (obj) return namespaceReady(null, obj);
      apiRequest(self, 'get', formatUrl('%@/n/%@', self.baseUrl(), namespaceId), namespaceReady);

      function namespaceReady(err, data) {
        if (err) return reject(err);
        cache.persist(namespaceId, data, noop);
        resolve(new INNamespace(self, data));
      }
    });
  });
};


/**
 * @function
 * @name InboxAPI#namespaces
 *
 * @description
 * Request namespaces associated with the signed in user account. Optionally updates an array
 * of INNamespace objects already present.
 *
 * @param {Array<INNamespace>=} optionalNamespaces An array of INNamespace objects to update.
 *   If unspecified, a new array will be constructed.
 *
 * @returns {Promise} a promise which is resolved with an INNamespace object, or else rejected
 *   with an error of some kind. The error may be from the cache subsystem, or may an HTTP
 *   response with an erroneous status code.
 */
InboxAPI.prototype.namespaces = function(optionalNamespaces) {
  var self = this;
  var cache = this._.cache;
  var updateNamespaces = null;

  if (isArray(optionalNamespaces)) {
    updateNamespaces = optionalNamespaces;
  }

  return this.promise(function(resolve, reject) {
    cache.getByType('namespace', function(err, set) {
      if (err) return reject(err);
      if (set && set.length) return namespacesReady(null, set);
      apiRequest(self, 'get', formatUrl('%@/n/', self.baseUrl()), namespacesReady);
    });

    function namespacesReady(err, set) {
      if (err) return reject(err);

      if (updateNamespaces) {
        return resolve(mergeModelArray(updateNamespaces, set, 'id', function(data) {
          cache.persist(data.id, data, noop);
          return new INNamespace(self, data);
        }));
      }

      set = map(set, function(item) {
        cache.persist(item.id, item, noop);
        return new INNamespace(self, item);
      });

      resolve(set);
    }
  });
};



/**
 * @class INModelObject
 *
 * @description
 * Abstract base-class for all client-exposed models held by the Inbox api.
 */


function INModelObject(inbox, id, namespaceId) {
  var namespace = null;
  var data = null;

  if (namespaceId) {
    if (typeof namespaceId === 'object') {
      if (namespaceId instanceof INNamespace) {
        namespace = namespaceId;
        namespaceId = namespace.namespaceId;
      } else {
        namespace = new INNamespace(inbox, namespaceId, namespaceId);
      }
    }
  }

  if (inbox instanceof INNamespace) {
    namespace = inbox;
    inbox = namespace.inbox();
    if (namespaceId && (namespaceId != namespace.id))
      throw new TypeError('Two different namespace IDs provided to INModelObject constructor.');
    namespaceId = namespace.id;
  }

  if (id && typeof id === 'object') {
    data = id;
    this.id = data.id;
    if (data.namespace_id) {
      if (namespaceId && (namespaceId != data.namespace_id))
        throw new TypeError('You cannot instantiate an INModelObject with JSON from one namespace'+
                            'into another namespace.');
      namespaceId = data.namespace_id;
    }
    
  } else if (id) {
    this.id = id;
  } else {
    this.id = '-selfdefined';
  }

  this.namespaceId = namespaceId;

  defineProperty(this, '_', INVISIBLE, null, null, {
    inbox: inbox,
    namespace: namespace
  });

  if (data) this.update(data);
}


/**
 * @function
 * @name INModelObject#namespace
 *
 * @description
 * Returns either the namespace instance associated with the model object, or creates a new one
 * instead.
 *
 * This is currently somewhat problematic as it becomes possible to construct multiple instances
 * of an INNamespace model object representing the same object on the server, but with different
 * data.
 *
 * Because of these problems, it should primarily be used only for fetching data from the server.
 *
 * @returns {INNamespace} an INNamespace object to which this model object is associated.
 */
INModelObject.prototype.namespace = function() {
  if (this._.namespace) {
    return this._.namespace;
  } else if (this.namespaceId) {
    return (this._.namespace = getNamespace(this.inbox(), this.namespaceId));
  }
  return null;
};


/**
 * @function
 * @name INModelObject#baseUrl
 *
 * @description
 * Returns the base URL of the Inbox instance. This method is merely a wrapper for calling
 * modelObject.inbox().baseUrl().
 *
 * @returns {string} the base URL of the Inbox instance.
 */
INModelObject.prototype.baseUrl = function() {
  return this._.inbox.baseUrl();
};


/**
 * @function
 * @name INModelObject#namespaceUrl
 *
 * @description
 * Returns the namespace URL (<base URL>/n/<namespaceId>) for this model object.
 *
 * @returns {string} The namespace URL for this model object, relative to the base URL.
 */
INModelObject.prototype.namespaceUrl = function() {
  if (!this.namespaceId)
    throw new TypeError('INModelObject namespaceUrl() is undefined because the model has no namespace ID');
  return formatUrl('%@/n/%@', this._.inbox.baseUrl(), this.namespaceId);
};


/**
 * @function
 * @name INModelObject#resourceName
 *
 * @description
 * The URL component for this resource, used to build URLs with the collection name
 *
 * @returns {string} The URL for this model.
 */
INModelObject.prototype.resourceName = function() {
  throw new TypeError('INModelObject base class does not have a resourceName()');
};


/**
 * @function
 * @name INModelObject#resourceUrl
 *
 * @description
 * The URL for this resource. If the model is unsynced, return null.
 * Otherwise, it is the path of the specific resource instance.
 *
 * @returns {string} The URL for this model.
 */
INModelObject.prototype.resourceUrl = function() {
  if (this.isUnsynced())
    return null;
  return formatUrl('%@/%@/%@', this.namespaceUrl(), this.resourceName(), this.id);
};


/**
 * @function
 * @name INModelObject#isUnsynced
 *
 * @description
 * Returns true if the model object was created locally and has never been synced to the
 * server. Returns false if the model object was fetched from the server.
 *
 * @returns {boolean} true if the model ID ends with '-selfdefined', otherwise false.
 */
INModelObject.prototype.isUnsynced = function() {
  return endsWith(this.id, '-selfdefined');
};


/**
 * @function
 * @name INModelObject#reload
 *
 * @description
 * If the model object is synced to the server, data is fetched from the server and applied to the
 * model object, and the promise is fulfilled with this value. Otherwise, the promise is fulfilled
 * with the unsynced value immediately.
 *
 * @returns {Promise} a Promise to be fulfilled when fetching is complete. It will be fulfilled
 *   with either a successful response, an error response, or an internal error such as a network
 *   error.
 */
INModelObject.prototype.reload = function() {
  var self = this;
  return this.promise(function(resolve, reject) {
    reloadModel(self, function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};


function reloadModel(model, callback) {
  if (model.isUnsynced()) return callback(null, model);
  apiRequest(model.inbox(), 'get', model.resourceUrl(), function(err, data) {
    if (err) return callback(err, null);
    model.update(data);
    persistModel(model);
    callback(null, model);
  });
}


/**
 * @function
 * @name INModelObject#update
 *
 * @description
 * Each internal model object class has an associated ResourceMapping, which defines how properties
 * are merged in. update() should be passed an object which contains properties such as those from
 * the web service. Property names and types are converted based on the rules of the
 * ResourceMapping. Unknown properties are ignored.
 */
INModelObject.prototype.update = function(data) {
  if (!data) return;
  var mapping = this.resourceMapping;
  var updated = data['__converted_from_raw__'] || false;

  forEach(mapping, function copyMappedProperties(mappingInfo, propertyName) {
    var cast = mappingInfo.to;
    var merge = mappingInfo.merge;
    var jsonKey = mappingInfo.jsonKey;
    var cnst = mappingInfo.cnst;
    var currentValue;
    var isObject;
    var key = updated ? propertyName : jsonKey;


    if (hasProperty(data, key)) {
      if (cnst) {
        this[propertyName] = cnst;
      } else {
        currentValue = data[key];
        if (typeof currentValue !== 'undefined') {
          cast = cast(currentValue, mappingInfo);
          isObject = cast && typeof cast === 'object';
          if (!this[propertyName] || !isObject || !merge) {
            this[propertyName] = cast;
          } else {
            merge(this[propertyName], cast);
          }
        }
      }
    } else if (cnst) {
      this[propertyName] = cnst;
    }
  }, this);
};


/**
 * @function
 * @name INModelObject#raw
 *
 * @description
 * Helper for converting the model object into an object containing the mapped properties.
 *
 * @returns {object} an object containing the mapped properties for the model object.
 */
INModelObject.prototype.raw = function() {
  var mapping = this.resourceMapping;
  var out = {};
  forEach(mapping, function copyMappedProperties(mappingInfo, propertyName) {
    var cast = mappingInfo.from;
    var jsonKey = mappingInfo.jsonKey;
    var cnst = mappingInfo.cnst;
    var isObject;
    var currentValue;

    if (hasProperty(this, propertyName)) {
      if (cnst) {
        out[jsonKey] = cnst;
      } else {
        currentValue = this[propertyName];
        cast = cast(currentValue, mappingInfo);
        isObject = cast && typeof cast === 'object';
        if (typeof currentValue !== 'undefined') {
          if (!isObject || !cast) {
            out[jsonKey] = cast;
          } else {
            out[jsonKey] = merge(isArray(cast) ? [] : {}, cast);
          }
        }
      }
    } else if (cnst) {
      out[jsonKey] = cnst;
    }
  }, this);
  return out;
};


/**
 * @function
 * @name INModelObject#toJSON
 *
 * @description
 * Like INModelObject#raw(), except that instead of returning the raw object itself, it will
 * instead return the object converted to JSON.
 *
 * @returns {string} the JSON-stringified raw resource value.
 */
INModelObject.prototype.toJSON = function() {
  return this.raw();
};


var casters = {
  array: {
    to: function castToArray(val) {
      if (isArray(val)) return val;
      return fromArray(val);
    },
    from: function castFromArray(val) {
      return val;
    },
    merge: function mergeSimpleArrays(dest, src) {
      // Merge simple arrays
      if (!isArray(dest)) return merge([], src || []);
      else if (!isArray(src) || !src.length) dest.length = 0;
      else {
        dest.length = src.length;
        for (var i = 0, ii = src.length; i < ii; ++i) {
          dest[i] = src[i];
        }
      }
      return dest;
    }
  },
  date: {
    to: function castToDate(val) {
      var v;
      switch (typeof val) {
      case 'number': return new Date((val >>> 0) * 1000);
      case 'string': return new Date(val);
      case 'object':
        if (val === null) return null;
        if (val instanceof Date) return val;
        if ((typeof val.toDate === 'function') && (v = val.toDate()) instanceof Date) return v;
        /* falls through */
      default:
        return undefined;
      }
    },
    from: function castFromDate(val) {
      var v;
      switch (typeof val) {
      case 'number': return val >>> 0;
      case 'string': return new Date(val).getTime();
      case 'object':
        if (val === null) return null;
        if (val instanceof Date) return (val.getTime() / 1000);
        if (typeof val.valueOf === 'function' && typeof (v = val.valueOf()) === 'number') return v;
        /* falls through */
      default:
        return;
      }
    }
  },

  int: function castToInt(val) {
    return (val) >>> 0;
  },

  string: function castToString(val) {
    if (val === null) return null;
    return '' + val;
  },

  bool: function castToBool(val) {
    return !!val;
  },

  'const': function castToConst(val, info) {
    return info.cnst;
  }
};


/**
 * @function
 * @name defineResourceMapping
 * @private
 *
 * @description
 * Private method for associated a ResourceMapping with an INModelObject subclass.
 *
 * The mapping is an object where the key is the 'client-side' name for the property, which is
 * typically camel-cased. Sometimes, the name is changed from the original value to be more
 * semantically correct, and avoid shadowing method names (for instance,
 * `messages` -> `messageIDs`).
 *
 * The property value is somewhat more complicated, and takes several forms:
 * If the name contains a colon `:`, the left-hand side is a 'type' name, which corresponds to
 * a value in the casters dictionary above. Everything to the right of this first `:` is the JSON
 * property name (the name for the property in server requests and responses). However, if the
 * `type` is `const`, a second check for another `:` is performed on the remainder of the string.
 * If the second `:` is found, then the value to the left is the JSON key, and the value to the
 * right is the value. If a second `:` is not found, then the right-most field is the constant
 * value, and the JSON key is assumed to be the same as the property name.
 *
 * Because this is complicated, here's a chart:
 *
 * ----------------+---------------------+------------------+---------------------------------------
 *   propertyName  |  propertyValue      |  type            |  value / heuristics
 * ----------------+---------------------+------------------+---------------------------------------
 *   subject       |  subject            |  string (default)| json.subject becomes model.subject
 * ----------------+---------------------+------------------+---------------------------------------
 *   messageIDs    |  array:messages     |  array           | json.messages[] becomes
 *                 |                     |                  | model.messageIDs[]
 * ----------------+---------------------+------------------+---------------------------------------
 *   resourceType  |  const:object:draft |  const (string)  | model.resourceType === 'draft',
 *                 |                     |                  | json.object === 'draft'.
 * ----------------+---------------------+------------------+---------------------------------------
 *
 * There are several supported types to cast to, including 'date', 'bool', 'string', and 'array'.
 *
 * @param {function} resourceClass Constructor for the child class of INModelObject.
 * @param {object} mapping Resource mapping, see the description for details.
 * @param {base=} base Base-class, from which this resourceMapping should inherit. By default, this
 *   is INModelObject.
 */
function defineResourceMapping(resourceClass, mapping, base) {
  var jsonProperties = {};

  function resourceMapping() {
    var x;
    for (x in this) {
      if (x !== 'jsonKeys' && x !== 'resourceMapping') {
        this[x] = this[x];
      }
    }
  }

  if (!base && base !== null) {
    base = INModelObject;
  }

  if (base) {
    inherits(resourceMapping, base.resourceMapping.constructor);
  }

  forEach(mapping, function(mapping, propertyName) {
    if (typeof mapping === 'string') {
      var split = mapping.indexOf(':');
      var type = 'string';
      var jsonKey = mapping;
      var cnst = false;
      if (split >= 0) {
        type = mapping.substring(0, split);
        jsonKey = mapping.substring(split + 1);
        if (type === 'const') {
          cnst = jsonKey;
          if ((split = jsonKey.indexOf(':')) >= 0) {
            cnst = jsonKey.substring(split + 1);
            jsonKey = jsonKey.substring(0, split);
          } else {
            jsonKey = propertyName;
          }
        }
        if (!hasProperty(casters, type)) {
          type = 'string';
          jsonKey = mapping;
        }
      }

      var caster = casters[type];
      var from;
      var to;
      var merge = null;

      if (typeof caster === 'function') {
        from = to = caster;
      } else if (typeof caster === 'object') {
        from = caster.from;
        to = caster.to;
        merge = caster.merge || null;
      }

      jsonProperties[jsonKey] = propertyName;
      resourceMapping.prototype[propertyName] = {
        jsonKey: jsonKey,
        to: to,
        from: from,
        merge: merge,
        type: type,
        cnst: cnst
      };
    }
  });

  defineProperty(resourceMapping.prototype, 'jsonKeys', INVISIBLE, null, null, jsonProperties);
  resourceMapping = new resourceMapping();
  defineProperty(resourceClass, 'resourceMapping', INVISIBLE, null, null, resourceMapping);
  defineProperty(resourceClass.prototype, 'resourceMapping', INVISIBLE, null, null,
    resourceMapping);
}


function mappingForProperty(propertyName, resource) {
  if (propertyName === 'jsonKeys' || propertyName === 'resourceMapping') return;
  var mapping = resource && resource.resourceMapping;
  if (mapping) {
    if (mapping.hasOwnProperty(propertyName)) {
      return mapping[propertyName];
    } else if (mapping.jsonKeys.hasOwnProperty(propertyName)) {
      return mapping[mapping.jsonKeys[propertyName]];
    }
  }
}


/**
 * @function
 * @name convertFromRaw
 * @private
 *
 * @description
 * Convert a raw JSON object into an object similar to what the resource would look like, by
 * transforming the properties in the same way.
 *
 * @param {object} object raw object from the server
 * @param {INModelObject} resource resource class
 */
function convertFromRaw(object, resource) {
  var mapping = resource.resourceMapping;
  var out;
  if (!mapping) return;
  out = {};

  forEach(mapping.jsonKeys, function copyMappedProperties(propertyName, jsonKey) {
    var mappingInfo = mapping[propertyName];
    var cast = mappingInfo.to;
    var cnst = mappingInfo.cnst;
    var isObject;
    var currentValue;

    if (hasProperty(object, jsonKey)) {
      currentValue = object[jsonKey];
      if (propertyName !== jsonKey) {
        delete object[jsonKey];
      }

      if (cnst) {
        object[propertyName] = cnst;
      } else {
        cast = cast(currentValue, mappingInfo);
        isObject = cast && typeof cast === 'object';
        if (typeof currentValue !== 'undefined') {
          object[propertyName] = cast;
        }
      }
    } else if (cnst) {
      object[propertyName] = cnst;
    }
  });
  defineProperty(object, '__converted_from_raw__', INVISIBLE, null, null, true);
}


/**
 * @property
 * @name INModelObject#id
 *
 * The id of the model object. This should be treated as private and read-only.
 */


/**
 * @property
 * @name INModelObject#namespaceId
 *
 * The ID of the associated namespace for this model object, should be treated as read-only.
 */


/**
 * @property
 * @name INModelObject#createdAt
 *
 * The date this model object was created. Read-only.
 */


/**
 * @property
 * @name INModelObject#updatedAt
 *
 * The date this model object was updated. Read-only.
 */
defineResourceMapping(INModelObject, {
  'id': 'id',
  'namespaceId': 'namespace_id',
  'createdAt': 'date:created_at',
  'updatedAt': 'date:updated_at'
}, null);


/**
 * @function
 * @name INModelObject#inbox
 *
 * @description
 * Returns the associated {InboxAPI} instance used to create this model object.
 */
defineProperty(INModelObject.prototype, 'inbox', INVISIBLE, null, null, function(resolver) {
  return this._.inbox;
});


/**
 * @function
 * @name INModelObject#promise
 *
 * @description
 * Helper for constructing a Promise object using the configured promise constructor.
 *
 * @param {function(function, function)} resolver Callback function which performs a task and
 *   fulfills the constructed promise.
 *
 * @returns {Promise} the constructed promise.
 */
defineProperty(INModelObject.prototype, 'promise', INVISIBLE, null, null, function(resolver) {
  return this.inbox().promise(resolver);
});

if (!Object.create) {
  var objectCreateConstructor = function() {};
}


/**
 * @function
 * @name inherits
 * @private
 *
 * @description
 * Private helper method causes a child class to prototypically inherit from a parent class.
 *
 * NOTE: Calling this method on a function will overwrite the child class' original prototype.
 * It should be called before any prototype methods have been defined.
 *
 * @param {function} childClass the child class which extends or augments the superClass.
 * @param {function} superClass the base class from which childClass will inherit.
 */
function inherits(childClass, superClass) {
  if (Object.create) {
    childClass.prototype = Object.create(superClass.prototype);
  } else {
    objectCreateConstructor.prototype = superClass.prototype;
    childClass.prototype = new objectCreateConstructor();
  }
  defineProperty(childClass.prototype, 'super', INVISIBLE, null, null, superClass);
  defineProperty(childClass, 'super', INVISIBLE, null, null, superClass);
  defineProperty(childClass.prototype, 'constructor', INVISIBLE, null, null, childClass);
}

/**
 * @function
 * @name valueFn
 * @private
 *
 * @description
 * A simple method which takes a single parameter, and returns that parameter. Useful for certain
 * kinds of partial application or currying.
 *
 * @param {*} obj any value of any type. This value will be returned from the method.
 *
 * @returns {*} returns whatever value was passed in.
 */
function valueFn(obj) {
  return obj;
}


/**
 * @function
 * @name noop
 * @private
 *
 * @description
 * A no-operation function, useful for simplifying code by ensuring that a callback is available
 * even if it does nothing useful.
 */
function noop() {}


/**
 * @function
 * @name merge
 * @private
 *
 * @description
 * A simple implementation of the common merge/extend operation. Only accepts two parameters.
 * TODO(@caitp): this should ideally support N parameters.
 *
 * @param {object|Array} dest the destination object to which items are copied.
 * @param {object|Array} src the source object from which items are copied.
 * @param {INModelObject=} resource optional resource class which defines how to merge properties.
 *
 * @returns {object|Array} the destination object.
 */
function merge(dest, src, resource) {
  var key;
  var a;
  var b;
  var mapping;
  for (key in src) {
    if (key !== '_') {
      mapping = resource && mappingForProperty(key, resource);
      if (src.hasOwnProperty(key)) {
        b = src[key];
        if (dest.hasOwnProperty(key)) {
          a = dest[key];
          if (typeof a === 'object' && typeof b === 'object') {
            if (mapping) {
              if (mapping.merge) dest[key] = mapping.merge(a, b);
            } else {
              var start = a ? (isArray(a) ? [] : {}) : null;
              dest[key] = merge(merge(start, a), b, true);
            }
            continue;
          }
          dest[key] = b;
        } else {
          dest[key] = b;
        }
      } else if (mapping) {
        // If there's a mapping for this property, delete it.
        delete dest[key];
      }
    }
  }
  return dest;
}


/**
 * @function
 * @name mergeModelArray
 * @private
 *
 * @description
 * Combine oldArray and newArray, placing the results in oldArray. Objects that already exist in
 * oldArray are not re-created. Items in newArray that need to be added to oldArray are passed through
 * the optional constructor function parameter to allow them to be transformed as necessary.
 *
 * @param {Array} oldArray the original Array, to extend with new items.
 * @param {Array} newArray the new array containing new data from the server.
 * @param {string} id the property name by which objects are identified. This is typically 'id'.
 * @param {function=} constructor A function that is called whenever an item from newArray will be placed
   in oldArray. Can be used to transform items as necessary or inflate them into INModelObjects.
 *
 * @returns {Array} the oldArray.
 */
function mergeModelArray(oldArray, newArray, idKey, constructor) {
  var oldItems = [];
  oldItems.concat(oldArray);
  oldArray.length = 0;

  for (var i = 0, ii = newArray.length; i < ii; ++i) {
    var item = null;
    for (var j = 0, jj = oldItems.length; j < jj; ++j) {
      if (oldItems[j][idKey] == item[idKey])
        item = oldItems[j];
    }
    if (!item) {
      if (constructor)
        item = constructor(newArray[i]);
      else
        item = newArray[i];
    }
    oldArray.push(item);
  }
  return oldArray;
}

/**
 * @function
 * @name fromArray
 * @private
 *
 * @description
 * Similar to ES6's Array.from, without support for iterators. Ensures that array-like objects are
 * proper Arrays and can be serialized to JSON correctly.
 *
 * @param {*} obj array-like object to be converted to a proper Array.
 *
 * @returns the constructed Array.
 */
function fromArray(obj) {
  if (Array.from) return Array.from(obj);
  if (!obj || !obj.length || typeof obj.length !== 'number' || obj.length !== obj.length) return [];
  var i;
  var ii = obj.length;
  var a = new Array(ii);
  var v;
  for (i = 0; i < ii; ++i) {
    v = obj[i];
    a[i] = v;
  }
  return a;
}


/**
 * @function
 * @name forEach
 * @private
 *
 * @description
 * Similar to AngularJS' forEach method --- this acts as both an ES5 Array#forEach polyfill, as well
 * as a way to iterate over property key/value pairs in plain Objects.
 *
 * @param {object|Array} collection object to iterate over
 * @param {function} fn callback to be invoked for each property
 * @param {object} thisArg the context on which to invoke the callback function.
 */
function forEach(collection, fn, thisArg) {
  var i, ii, key;
  if (typeof thisArg !== 'object' && typeof thisArg !== 'function') {
    thisArg = null;
  }
  if (isArray(collection)) {
    if (collection.forEach) {
      collection.forEach(fn, thisArg);
    } else {
      for (i = 0, ii = collection.length; i < ii; ++i) {
        fn.call(thisArg, collection[i], i, collection);
      }
    }
  } else if (Object.getOwnPropertyNames) {
    var keys = Object.getOwnPropertyNames(collection);
    for (i = 0, ii = keys.length; i < ii; ++i) {
      key = keys[i];
      fn.call(thisArg, collection[key], key, collection);
    }
  } else {
    for (key in collection) {
      if (hasOwnProperty(collection, key)) {
        fn.call(thisArg, collection[key], key, collection);
      }
    }
  }
}


/**
 * @function
 * @name map
 * @private
 *
 * @description
 * Essentially a polyfill for ES5 Array#map --- maps a collection by replacing each resulting
 * value with the result of a callback.
 *
 * @param {Array} collection the collection to be mapped to a new collection
 * @param {function} fn callback function which should return the mapped value.
 * @param {object} thisArg the context on which to invoke the callback function
 *
 * @returns {Array} the mapped array.
 */
function map(collection, fn, thisArg) {
  var i, ii, key, result;
  if (!collection) return;
  if (typeof collection.map === 'function') return collection.map(fn, thisArg);
  if (!isArray(collection)) return;

  if (typeof thisArg !== 'object' && typeof thisArg !== 'function') {
    thisArg = null;
  }

  result = new Array(collection.length);
  for (i = 0, ii = collection.length; i < ii; ++i) {
    result[i] = fn.call(thisArg, collection[i], i, collection);
  }
  return result;
}

/**
 * @function
 * @name now
 * @private
 *
 * @description
 * Returns the current unix timestamp (milliseconds elapsed since the epoch,
 * 1 January 1970 00:00:00 UTC.). If Date.now is unavailable, a polyfill is used instead.
 *
 * @returns {number} The current unix timestamp (milliseconds elapsed since the epoch).
 */
var Now = (function() {
  if (typeof Date.now === 'function') {
    return Date.now;
  } else {
    return function() {
      return (new Date()).getTime();
    };
  }
})();


/**
 * @function
 * @name parseDate
 * @private
 *
 * @description
 * Parses a string, and returns the unix timestamp. If the date string contains a timezone, then
 * the result is in that timezone. Otherwise, it is in UTC. If Date.parse is not available, then
 * the parsed value is instead the result of `(new Date(dateString)).getTime()`, which can
 * behave somewhat differently.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
 * for details.
 *
 * @param {string} dateString value to parse as a date.
 *
 * @returns {number} The unix timestamp for the parsed date, possibly NaN.
 */
var parseDate = (function() {
  if (typeof Date.parse === 'function') {
    return Date.parse;
  } else {
    return function(dateString) {
      return (new Date(dateString)).getTime();
    };
  }
})();


/**
 * @function
 * @name toUnixTimestamp
 * @private
 *
 * @description
 * Convert a value into a timestamp understood by the Inbox filtering API.
 *
 * The filtering API understands timestamps in terms of seconds since the epoch, presumably in UTC.
 * Since JavaScript deals in milliseconds since the epoch, it's necessary to truncate the number.
 * Currently this is done by dividing the timestamp by 1000 and truncating the fractional part.
 *
 * @param {*} date the value representing a given date. Hopefully this is an ES5-compatible Date
 *   object, or it's possible to have some problems.
 *
 * @returns {number} a truncated number representing seconds since the epoch, in some unguaranteed
 *   timestamp. May return NaN if a value could not be converted to a number.
 */
function toUnixTimestamp(date) {
  var timestamp;
  if (typeof date === 'number') {
    return date;
  } else if (typeof date === 'string') {
    // if Number(date) is not NaN, then we can treat it as a timestamp ---
    // Otherwise, see if Date can parse it, and use the Date timestamp.
    timestamp = Number(date);
    if (timestamp !== timestamp) {
      timestamp = parseDate(date);
      if (timestamp !== timestamp) return timestamp;
      timestamp = (timestamp / 1000) >>> 0;
    }
    // May be NaN
    return timestamp;
  } else if (typeof date === 'object') {
    // It might be a Moment.js date, or a real Date, or something in between.
    // If the object isn't recognized, try to use the results of toString()
    // and parse it as a string.
    if (date instanceof Date) {
      return (date.getTime() / 1000) >>> 0;
    } else if (typeof (timestamp = date.toString()) === 'string') {
      return toUnixTimestamp(timestamp);
    }
  }

  // If we get this far, then it's not clear what to do with it. Just return NaN so the item is
  // removed from filters.
  return NaN;
}

/**
 * @function
 * @name addListener
 * @private
 *
 * @description
 * Adds an event listener to a DOM object.
 *
 * @param {object} object target of the event (DOM object)
 * @param {string} event name of the event, such as 'load'.
 * @param {function} handler callback to be invoked in response to the event.
 */
var addListener = (function() {
  if (typeof window.addEventListener === 'function') {
    return function addEventListener(object, event, handler) {
      return object.addEventListener(event, handler);
    };
  } else if (typeof window.attachEvent === 'function') {
    return function attachEventListener(object, event, handler) {
      return object.attachEvent('on' + event, handler);
    };
  } else {
    return function addListenerUnavailable(object, event) {
      throw new TypeError('Unable to add event listener "' + event + '" to object ' + object +
                          ': addEventListener and attachEvent are unavailable');
    };
  }
})();


/**
 * @function
 * @name removeListener
 * @private
 *
 * @description
 * Removes an event listener to a DOM object.
 *
 * @param {object} object target of the event (DOM object)
 * @param {string} event name of the event, such as 'load'.
 * @param {function} handler callback to remove from the target's handlers for the event.
 */
var removeListener = (function() {
  if (typeof window.addEventListener === 'function') {
    return function removeEventListener(object, event, handler) {
      return object.removeEventListener(event, handler);
    };
  } else if (typeof window.attachEvent === 'function') {
    return function detachEvent(object, event, handler) {
      return object.detachEvent('on' + event, handler);
    };
  } else {
    return function removeListenerUnavailable(object, event) {
      throw new TypeError('Unable to add event listener "' + event + '" to object ' + object +
                          ': removeEventListener and detachEvent are unavailable');
    };
  }
})();


/**
 * @function
 * @name addListeners
 * @private
 *
 * @description
 * For each key/value in object 'listeners', add an event listener for 'key', whose value is the
 * handler.
 *
 * @param {object} object target of the event (DOM object)
 * @param {object} listeners object whose keys are event names, and whose values are handlers
 *    for the respective event name.
 */
function addListeners(object, listeners) {
  var key;
  for (key in listeners) {
    if (listeners.hasOwnProperty(key) && typeof listeners[key] === 'function') {
      addListener(object, key, listeners[key]);
    }
  }
}

/**
 * @function
 * @name toJSON
 * @private
 *
 * @description
 * Stringify an object. Technically, it's possible to stringify strings, but this use case is not
 * supported here.
 *
 * This requires the JSON object to be available. If it's not available, consider using a
 * polyfill such as http://bestiejs.github.io/json3/
 *
 * @param {object} maybeJSON value to stringify as JSON.
 * @param {function=} replacer optional callback for replacing values.
 * @param {number=} indent optional indent value, for printing JSON in a pretty fashion. Unused
 *   by the framework, but may be used to assist in debugging in the future.
 *
 * @returns {string} the stringified JSON, or unstringified string or function if maybeJSON is
 *   not an acceptable type.
 */
var toJSON = (function() {
  if (window.JSON && typeof window.JSON.stringify === 'function') {
    return function(maybeJSON, replacer, indent) {
      if (typeof maybeJSON !== 'string' && typeof maybeJSON !== 'function') {
        return JSON.stringify(maybeJSON, replacer, indent);
      } else {
        return maybeJSON;
      }
    };
  } else {
    return function(maybeJSON) {
      throw new TypeError('Cannot perform `toJSON` on ' + maybeJSON + ': JSON.stringify not ' +
                          'available.');
    };
  }
})();


/**
 * @function
 * @name parseJSON
 * @private
 *
 * @description
 * Parse a JSON string to a value.
 *
 * This requires the JSON object to be available. If it's not available, consider using a
 * polyfill such as http://bestiejs.github.io/json3/
 *
 * @param {string} json the JSON string to parse
 * @param {function=} reviver optional reviver, unused by the framework.
 *
 * @returns {object|string|number} the parsed JSON value.
 */
var parseJSON = (function() {
  if (window.JSON && typeof window.JSON.parse === 'function') {
    return function(json, reviver) {
      if (typeof json === 'string') {
        if (typeof reviver !== 'function') reviver = null;
        return JSON.parse(json, reviver);
      }
      return json;
    };
  } else {
    return function(json) {
      throw new TypeError('Cannot perform `parseJSON` on ' + json + ': JSON.parse not ' +
                          'available.');
    };
  }
})();

var INVISIBLE = 1;
var CONFIGURABLE = 2;
var WRITABLE = 4;


/**
 * @function
 * @name hasProperty
 * @private
 *
 * @description
 * Helper for invoking Object#hasOwnProperty. Older versions of IE have issues calling this on DOM
 * objects, and it's also possible to invoke hasOwnProperty on functions using this.
 *
 * @param {object|function} obj the object to test for the presence of propertyName
 * @param {string} propertyName the property name to test for.
 *
 * @returns {boolean} true if the target object has own property `propertyName`, otherwise false.
 */
function hasProperty(obj, propertyName) {
  if (obj === null || obj === undefined) {
    return false;
  }
  return (obj.hasOwnProperty && obj.hasOwnProperty(propertyName)) ||
          Object.prototype.hasOwnProperty.call(obj, propertyName);
}


/**
 * @function
 * @name defineProperty
 * @private
 *
 * @description
 * Helper for defining properties. Typically used for defining data properties, but also enables
 * defining getters/setters, though these are not currently used by the framework.
 *
 * Flags:
 *   1. INVISIBLE --- If specified, the property is non-enumerable
 *   2. CONFIGURABLE --- If specified, the property is configurable
 *   3. WRITABLE --- If specified, the property is writable
 *
 * @param {object|function} object the target object on which to define properties.
 * @param {string} name the property name to define.
 * @param {numnber} flags flags --- any bitwise combination of INVISIBLE (1), CONFIGURABLE (2), or
 *   WRITABLE (4), or 0 for none of the above.
 * @param {function} get a function to invoke for getting a property. Not supported in old browsers.
 * @param {function} set a function to invoke for setting a property value. Not supported in old
 *   browsers.
 * @param {*} value If specified, it is a data value for the property.
 */
function defineProperty(object, name, flags, get, set, value) {
  if (Object.defineProperty) {
    var defn = {
      enumerable: !(flags & INVISIBLE),
      configurable: !!(flags & CONFIGURABLE),
      writable: !!(flags & WRITABLE)
    };
    if (typeof get === 'function') {
      defn.get = get;
      if (typeof set === 'function') {
        defn.set = set;
      }
    } else if (arguments.length > 5) {
      defn.value = value;
    }
    Object.defineProperty(object, name, defn);
  } else {
    if (typeof get === 'function') {
      object[name] = get();
    } else if (arguments.length > 5) {
      object[name] = value;
    }
  }
}

/**
 * @function
 * @name formatString
 * @private
 *
 * @description
 * Given a template string, replace each `%@` in the string with a stringified value (arguments
 * following the template).
 *
 * E.G, formatString('%@, %@!', 'Hello', 'World') -> 'Hello, World!'
 *
 * @param {string} template the string template to process.
 * @param {...*} args values to replace the instances of `%@` in the template string.
 *
 * @returns {string} the processed string.
 */
function formatString(template, args) {
  var i = 0, ii;
  args = Array.prototype.slice.call(arguments, 1);
  ii = args.length;
  return template.replace(/\%\@/g, function() {
    if (i < ii) {
      return '' + args[i++];
    }
    return '';
  });
}


/**
 * @function
 * @name endsWith
 * @private
 *
 * @description
 * Returns true if a string ends with a given search, otherwise false.
 *
 * @param {string} str target string which is tested to see if it ends with the search string
 * @param {string} search string to sesarch for at the end of the target string.
 *
 * @returns {boolean} true if the target string ends with the search string, otherwise false
 */
function endsWith(str, search) {
  if (typeof str === 'undefined') str = '';
  str = '' + str;
  var position = str.length;
  position -= search.length;
  var lastIndex = str.indexOf(search, position);
  return lastIndex !== -1 && lastIndex === position;
}

var CAPITALIZE_STRING_REGEXP = /(^.)|(\s.)/g;
function capitalizeStringReplacer(c) {
  return c.toUpperCase();
}


/**
 * @function
 * @name capitalizeString
 * @private
 *
 * @description
 * Capitalize each word in a string, similar to [NSString capitalizedString] in Foundation.
 *
 * @param {string} str the string to capitalize
 *
 * @returns {string} the string, with the first letter of each word capitalized.
 */
function capitalizeString(str) {
  // Based on NSString#capitalizeString()
  return ('' + str).replace(CAPITALIZE_STRING_REGEXP, capitalizeStringReplacer);
}

/**
 * @function
 * @name formatUrl
 * @private
 *
 * @description
 * Given a template string, replace each `%@` in the string with a stringified value (arguments
 * following the template).
 *
 * E.G, formatString('%@, %@!', 'Hello', 'World') -> 'Hello, World!'
 *
 * This is similar to {formatString}, with the exception that for parameter names, leading and
 * trailing slashes are removed automatically.
 *
 * @param {string} template the string template to process.
 * @param {...*} args values to replace the instances of `%@` in the template string.
 *
 * @returns {string} the processed string.
 */
function formatUrl(template, args) {
  var i = 0;
  var ii;
  args = Array.prototype.slice.call(arguments, 1);
  ii = args.length;

  return template.replace(/\%\@/g, function() {
    if (i < ii) {
      var str = args[i++];
      if (typeof str === 'undefined') return '';
      return ('' + str).
        replace(/^\/+/, '').
        replace(/\/+$/, '');
    }
    return '';
  });
}

var ARRAY_BRACKET_REGEXP = /\[\]$/;

function buildURLParams(key, value, add) {
  var i, ii, name, v, classicArray = false;
  if (isArray(value)) {
    classicArray = key.test(ARRAY_BRACKET_REGEXP);
    for (i = 0, ii = value.length; i < ii; ++i) {
      v = value[i];
      if (classicArray) {
        add(key, v);
      } else {
        buildURLParams(key + '[' + (typeof v === 'object' ? i : '') + ']', v, add);
      }
    }
  } else if (typeof value === 'object') {
    for (name in value) {
      buildURLParams(key + '[' + name + ']', value[name], add);
    }
  } else {
    add(key, value);
  }
}

// Based on jQuery.param (2.x.x)
function serializeURLParams(params) {
  var key, s;
  function add(key, value) {
    value = typeof value === 'function' ? value() : value == null ? '' : value;
    s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }

  if (typeof params === 'object') {
    s = [];
    for (key in params) {
      if (params.hasOwnProperty(key)) {
        buildURLParams(key, params[key], add);
      }
    }
  }

  return s.join('&').replace(/%20/, '+');
}

// supported filter options. if their value is 'true', their new key is the same as their old key.
// if their value is a string, it is the name of their valid key.
var FILTER_NAMES_OPTS = {
  'subject': true,
  'email': 'any_email',
  'any_email': 'any_email',
  'from': true,
  'to': true,
  'cc': true,
  'bcc': true,
  'threadId': 'thread_id',
  'messageId': 'message_id',
  'tag': true,
  'filename': true,
  'lastMessageBefore': 'last_message_before',
  'lastMessageAfter': 'last_message_after',
  'startedBefore': 'started_before',
  'startedAfter': 'started_after',
  'limit': true,
  'offset': true
};

// After converting to filtered names, these parameters must be converted to unix timestamps.
var FILTER_DATES = {
  'last_message_before': true,
  'last_message_after': true,
  'started_before': true,
  'started_after': true
};

var FILTER_REGEXPS = {
  'subject': true
};

var FILTER_STRINGS = {
  'subject': true,
  'any_email': true,
  'from': true,
  'to': true,
  'cc': true,
  'bcc': true,
  'thread_id': true,
  'message_id': true,
  'tag': true,
  'filename': true
};

var FILTER_INTS = {
  'limit': true,
  'offset': true
};

var INT_REGEXP = /^((0x[0-9a-f]+)|([0-9]+))$/i;


/**
 * @function
 * @name applyFilters
 * @private
 *
 * @description
 * Apply a collection of filters to a URL (returns a query string).
 *
 * Supported filters include:
 *   - subject
 *       Return messages or threads with a subject matching this string or regular expression.
 *
 *   - email
 *       Return messages or threads in which this email address has participated, either as a
 *       sender, receiver, CC or BCC.
 *
 *   - from
 *       Return messages or threads sent by this participant
 *
 *   - to
 *       Return messages or threads in which this participant has been the recipient
 *
 *   - cc
 *       Return messages or threads in which this participant has been CC'd
 *
 *   - bcc
 *       Return messages or threads in which this participant has been BCC'd
 *
 *   - threadId
 *       Return messages, files or drafts attached to this thread.
 *
 *   - tag
 *       Return messages or threads tagged with this tag.
 *
 *   - filename
 *       Return files with this matching filename, or threads/messages where this filename was
 *       attached.
 *
 *   - lastMessageBefore
 *       Return threads whose last message arrived before this date.
 *
 *   - lastMessageAfter
 *       Return threads whose last message arrived after this date.
 *
 *   - startedBefore
 *       Return messages or threads which started before this date.
 *
 *   - startedAfter
 *       Return messages or threads which started after this date.
 *
 *   - limit
 *       The maximum number of items to return from the server. The server will impose a default
 *       limit even if this value is not specified.
 *
 *   - offset
 *       The offset in the collection of records, useful for pagination.
 *
 * @param {object} filters A collection of filters to use.
 *
 * @returns {string}| A query string, or the empty string if no filters are used.
 */
function applyFilters(filters) {
  var params;
  var key;
  var value;
  var result = '';
  if (!filters || typeof filters !== 'object' || isArray(filters)) {
    return '';
  }

  params = {};

  for (key in filters) {
    value = FILTER_NAMES_OPTS[key];
    if (value === true) {
      params[key] = filters[key];
    } else if (typeof value === 'string') {
      params[value] = filters[key];
    }
  }

  for (key in params) {
    value = params[key];
    if (typeof value === 'function') {
      value = value();
    }

    if (FILTER_DATES[key] === true) {
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'object') {
        value = toUnixTimestamp(value);
        params[key] = value;
        if (typeof value === 'number' && ((value !== value) || (Math.abs(value) === Infinity))) {
          // NaN/Infinity timestamp --- don't send.
          delete params[key];
        }
      } else {
        // Invalid timestamp
        delete params[key];
      }
    } else if (FILTER_REGEXPS[key] === true && params[key] instanceof RegExp) {
      params[key] = params[key].toString();
    } else if (FILTER_INTS[key] === true) {
      if ((typeof value === 'string' && INT_REGEXP.test(value)) || typeof value === 'number') {
        value = Number(value);
        if (value === value && Math.abs(value) !== Infinity) {
          params[key] = value;
        } else {
          delete params[key];
        }
      } else {
        delete params[key];
      }
    }
    if (FILTER_STRINGS[key] === true && typeof params[key] === 'object') {
      delete params[key];
    }
  }

  result = serializeURLParams(params);
  return result ? '?' + result : '';
}

var IE8_METHODS = /^(get|post|head|put|delete|options)$/i;


/**
 * @function
 * @name xhrForMethod
 * @private
 *
 * @description
 * Construct a new XMLHttpRequest. Under some circumstances, some Internet Explorer hacks are
 * required to make old IE happy.
 *
 * @param {string} method the method to use.
 *
 * @returns {XMLHttpRequest} a newly constructed XMLHttpRequest object.
 */
function xhrForMethod(method) {
  if (document.documentMode <= 8 && (method.match(IE8_METHODS) || !window.XMLHttpRequest)) {
    return new window.ActiveXObject('Microsoft.XMLHTTP');
  } else if (window.XMLHttpRequest) {
    return new window.XMLHttpRequest();
  }
  return null;
}


/**
 * @function
 * @name xhrMaybeJSON
 * @private
 *
 * @description
 * Safari 7 has issues with responseType=json, because support for it was added to WebKit relatively
 * late. Due to it not being supported, the browser will throw an exception when assigning 'json'
 * to the responseType property, and we'd prefer to avoid this.
 *
 * In this library, even if json is not supported, we can still manually parse the JSON response.
 *
 * @param {XMLHttpRequest} xhr the HTTP request on which to operate
 */
function xhrMaybeJSON(xhr) {
  try {
    xhr.responseType = 'json';
  } catch(e) {
    // Safari 7 does not support the 'json' responseType, but supports the
    // responseType property, which will throw if passed an unsupported
    // DOMString value.
  }
}


/**
 * @function
 * @name xhrData
 * @private
 *
 * @description
 * Returns an XMLHttpRequest object and its response data into a wrapped response used by this
 * framework.
 *
 * @param {XMLHttpRequest} xhr the HTTP request on which to operate
 * @param {*} response the processed response data
 *
 * @returns {object} An object containing 'status', 'statusText', 'data', and parsed headers as
 *   'headers'.
 */
function xhrData(xhr, response) {
  return {
    status: xhr.status,
    statusText: xhr.statusText,
    data: response,
    headers: parseResponseHeaders(xhr)
  };
}


/**
 * @function
 * @name rejectXHR
 * @private
 *
 * @description
 * Returns an event listener which rejects an HTTP request.
 *
 * @param {object} cb an object containing a property 'cb', which is a function to call on
 *   completion. The returned callback will set that value to NULL when called, preventing
 *   it from being called multiple times.
 * @param {XMLHttpRequest} xhr the HTTP request on which to operate.
 * @param {string} type the response type --- typically JSON.
 *
 * @returns {function} a function to be used as an event listener for XMLHttpRequest events.
 */
function rejectXHR(cb, xhr, type) {
  return function() {
    if (!cb.cb) return;
    var callback = cb.cb;
    cb.cb = null;
    var response = null;
    if (type === 'json') {
      response = parseJSON('response' in xhr ? xhr.response : xhr.responseText);
    }
    callback(xhrData(xhr, response), null);
  };
}


/**
 * @function
 * @name parseResponseHeaders
 * @private
 *
 * @description
 * Parse an XMLHttpRequest's response headers into an object, by separating by newlines, and
 * splitting each string on the first instance of ': '.
 *
 * XMLHttpRequest exposes an opaque response which hides certain headers, so not all headers
 * can necessarily be returned from this method. See http://fetch.spec.whatwg.org/ and
 * http://xhr.spec.whatwg.org/ for details.
 *
 * @param {XMLHttpRequest} xhr the XMLHttpRequest to process.
 *
 * @returns {object} the parsed headers
 */
function parseResponseHeaders(xhr) {
  var headerStr = xhr.getAllResponseHeaders();
  var headers = {};
  if (!headerStr) {
    return headers;
  }
  var headerPairs = headerStr.split('\u000d\u000a');
  for (var i = 0; i < headerPairs.length; i++) {
    var headerPair = headerPairs[i];
    // Can't use split() here because it does the wrong thing
    // if the header value has the string ': ' in it.
    var index = headerPair.indexOf('\u003a\u0020');
    if (index > 0) {
      var key = headerPair.substring(0, index);
      var val = headerPair.substring(index + 2);
      headers[key.toLowerCase()] = val;
    }
  }
  return headers;
}


/**
 * @function
 * @name apiRequest
 * @private
 *
 * @description
 * Method for making API requests to the Inbox server. This is meant to handle slight variations
 * between different implementations of XMLHttpRequest, and in the future may support Fetch
 * requests as well.
 *
 * This version of the call uses a simple callback on completion, rather than a promise, primariloy
 * due to issues with the promise mocks in the test harness. However there is a perf-benefit to this
 * as well, and we avoid creating unnecessary promises all the time.
 *
 * @param {InboxAPI} inbox the InboxAPI instance, used for its http configuration
 * @param {string} method the request method
 * @param {string} url the URL to route the HTTP request
 * @param {string|object=} data the data to send, defaults to null
 * @param {function(error, response)} callback function to be invoked after the request is complete
 */
function apiRequest(inbox, method, url, data, responseType, callback) {
  if (typeof responseType === 'function') {
    callback = responseType;
    responseType = null;
  }
  if (typeof data === 'function') {
    callback = data;
    data = null;
  } else if (typeof data !== 'string' && typeof data !== 'object') {
    data = null;
  }

  if (typeof callback !== 'function') {
    callback = noop;
  }

  var cb = {cb: callback};
  var xhr = xhrForMethod(method);

  xhr.withCredentials = inbox.withCredentials();
  var failed = rejectXHR(cb, xhr, 'json');
  addListeners(xhr, {
    'load': function(event) {
      if (!cb.cb) return;
      var response;
      switch (xhr._responseType) {
        case 'text': /* falls through */
        case 'json':
          response = parseJSON('response' in xhr ? xhr.response : xhr.responseText);
          break;
        default: response = xhr.response;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        callback(null, response);
      } else {
        callback(xhrData(xhr, response), null);
      }
    },
    // TODO: retry count depending on status?
    'error': failed,

    'abort': failed
    // TODO: timeout/progress events are useful.
  });

  if (!responseType) {
    // Most responses are JSON responses.
    responseType = 'json';
    xhrMaybeJSON(xhr);
  } else {
    try {
      xhr.responseType = responseType;
    } catch (e) {
      return callback(e, null);
    }
  }
  xhr._responseType = responseType;

  xhr.open(method, url);

  inbox.forEachRequestHeader(xhr.setRequestHeader, xhr);

  xhr.send(data);
}


/**
 * @function
 * @name apiRequestPromise
 * @private
 *
 * @description
 * Simple wrapper for apiRequest() which returns a Promise instead of using a callback.
 * Useful for simple methods which do not need to check the cache before running.
 *
 * @param {InboxAPI} inbox the InboxAPI instance, used for its http configuration
 * @param {string} method the request method
 * @param {string} url the URL to route the HTTP request
 * @param {string|object=} data the data to send, defaults to null
 * @param {function(object)} callback function to be invoked when the request is loaded, can
 *   transform the response.
 *
 * @returns {Promise} a promise to be fulfilled with the response from the server.
 */
function apiRequestPromise(inbox, method, url, data, callback) {
  if (typeof data === 'function') {
    callback = data;
    data = null;
  } else if (typeof data !== 'string') {
    data = null;
  }
  if (typeof callback !== 'function') {
    callback = valueFn;
  }

  return inbox.promise(function(resolve, reject) {
    apiRequest(inbox, method, url, data, function(err, value) {
      if (err) return reject(err);
      return resolve(callback(value));
    });
  });
}

/**
 * @class INCache
 *
 * @description
 * Abstract class responsible for caching data on the client. This class is exposed to applications
 * via InboxAPI#Cache.
 *
 * @param {InboxAPI} inbox The InboxAPI instance which owns this cache.
 * @param {name} name An extra property which may be used by child classes in order to manage multiple
 *   caches. Typically should be associated with a single Inbox account.
 */
function INCache(inbox, name) {
  defineProperty(this, '_', INVISIBLE, null, null, {
    inbox: inbox,
    cacheName: name || 'inbox.js'
  });
}


/**
 * @method
 * @name INCache#get
 *
 * @description
 * Get an object represented by an `id` from the cache. The object may be of any type, so long as the
 * id matches. This method is assumed to be asynchronous.
 *
 * When subclassing INCache, if no error has occurred, the callback should pass a `null` value for the
 * error parameter. Similarly, if a cached item is not found, the callback should pass either a `null`
 * or `undefined` value for the value parameter.
 *
 * @param {string} id The id of the object to be returned.
 * @param {function(error, object)} callback Callback to be called when the asynchronous operation
 *   is complete. The callback expects two parameters --- the first is an error, in case a problem
 *   occurred. The second is the cached value.
 */
INCache.prototype.get = function(id, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#get(): %@#get() is not implemented.',
    name, name));
};


/**
 * @method
 * @name INCache#getByType
 *
 * @description
 * Get a collection of objects of a given type from the cache. This method is assumed to be
 * asynchronous.
 *
 * When subclassing INCache, if no error has occurred, the callback should pass a `null` value for the
 * error parameter. Similarly, if a cached item is not found, the callback should pass either a `null`
 * or `undefined` value for the values parameter.
 *
 * @param {string} type The lower-cased object type to collect. Should correspond with the `object`
 *   property values found in responses from the Inbox API.
 * @param {function(error, values)} callback Callback to be called when the asynchronous operation
 *   is complete. The callback expects two parameters --- the first is an error, in case a problem
 *   occurred. The second is an array of the cached values, if found.
 */
INCache.prototype.getByType = function(type, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#getByType(): %@#getByType() is not implemented.',
    name, name));
};


/**
 * @method
 * @name INCache#persist
 *
 * @description
 * Persist a single item in the cache. The item is an object, and is associated with an id. This
 * method is assumed to be asynchronous.
 *
 * When subclassing INCache, if no error has occurred, the callback should pass a `null` value for the
 * error parameter. Similarly, if a cached item is not found, the callback should pass either a `null`
 * or `undefined` value for the values parameter.
 *
 * @param {string} id The primary key to associate the object with.
 * @param {object} object The object to be cached.
 * @param {function(error, values)} callback Callback to be called when the asynchronous operation
 *   is complete. The first parameter is an error, if an error has occurred. The second parameter may
 *   be the cached values, but may be safely ignored.
 */
INCache.prototype.persist = function(id, object, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#persist(): %@#persist() is not implemented.',
    name, name));
};


/**
 * @method
 * @name INCache#remove
 *
 * @description
 * Remove a single item from the cache. This method is assumed to be asynchronous.
 *
 * When subclassing INCache, if no error has occurred, the callback should pass a `null` value for
 * the error parameter. If a value is successfully removed, the original cached value should be
 * passed as the second parameter to the callback.
 *
 * @param {string} id The primary key to be removed from the cache.
 * @param {function(error, values)} callback Callback to be called when the asynchronous operation
 *   is complete. The first parameter is an error, if an error has occurred. The second parameter
 *   should contain the cached value which was removed.
 */
INCache.prototype.remove = function(id, callback) {
  var name = this.cacheType || this.constructor.name || 'Cache';
  throw new Error(formatString('cannot invoke %@#remove(): %@#remove() is not implemented.',
    name, name));
};

var caches = {};


/**
 * @function
 * @name INCache.register
 *
 * @description
 * Register a custom cache type with the system, enabling the use of user-defined cache strategies.
 *
 * The call to register() should occur before any subclassed methods are defined in the prototype,
 * because the process of implicitly extending INCache will overwrite the prototype of the child
 * class.
 *
 * @param {string} name The registered name of the cache class. This is the name used to find the
 *   cache class in the map of registered cache classes when InboxAPI is configured with
 *   `cache: <string>`. Cache class-names are case-insensitive.
 * @param {function(InboxAPI, name)} The constructor to register. The constructor will implicitly
 *   extend INCache if it does not already.
 */
defineProperty(INCache, 'register', 0, null, null, function(name, constructor) {
  if (typeof constructor !== 'function') {
    throw new TypeError('Cannot invoke `INCache#register()`: constructor is not a function.');
  }

  if (!(constructor instanceof INCache)) {
    inherits(constructor, INCache);
  }

  if (!hasProperty(constructor.prototype, 'cacheType')) {
    defineProperty(constructor.prototype, 'cacheType', INVISIBLE, null, null, name);
  } else {
    try {
      defineProperty(constructor.prototype, 'cacheType', INVISIBLE, null, null,
        '' + constructor.prototype.cacheType);
    } catch (e) {}
  }
  name = ('' + name).toLowerCase();
  caches[name] = constructor;
});

defineProperty(INCache, 'unregister', 0, null, null, function(name) {
  name = ('' + name).toLowercase();
  if (hasProperty(caches, name)) {
    delete caches[name];
  }
});


/**
 * @function getCacheType
 * @private
 *
 * @description
 * Translate a string, constructor, or object into a cacheType.
 *
 * @param {string|function|object} cache the cache to get the cacheType from
 *
 * @returns {string} the cacheType of the object
 */
function getCacheType(cache) {
  var type;
  if (typeof cache === 'function' && cache.prototype) {
    type = cache.prototype.cacheType;
  } else if (typeof cache === 'object' && cache) {
    type = cache.cacheType;
  } else if (typeof cache === 'string') {
    type = cache;
  }

  if (typeof type === 'string' && type) {
    return type.toLowerCase();
  }

  return undefined;
}


/**
 * @function INCache.isRegistered
 *
 * description
 * A simple helper to determine if a given cache is registered. This method only checks if a
 * name or constructor is registered, and will not check if a specific cache instance is
 * registered.
 *
 * @param {function|string} cacheOrName Either the constructor of a given cache, or the name for
 *   which the cache may be registered as.
 * @returns {boolean} Returns true if the cache is determined to be registered, and returns false
 *   if the cache is not in the map of registered caches, or if the type is not appropriate.
 */
defineProperty(INCache, 'isRegistered', 0, null, null, function(cacheOrName) {
  return hasProperty(caches, getCacheType(cacheOrName));
});


/**
 * @function getCacheByName
 * @private
 *
 * @description
 * Return the registered cache constructor for the given cache name, or undefined
 *
 * @param {string} cacheName the name of the cache
 *
 * @returns {function} the registered cache constructor for the given cache name, or undefined
 */
function getCacheByName(cacheName) {
  if (typeof cacheName === 'string' && cacheName) {
    return caches[cacheName.toLowerCase()];
  }
}


/**
 * @function
 * @name persistModel
 *
 * @description
 * Private helper for persisting INModelObjects in the cache.
 *
 * @param {INModelObject} The model object to cache.
 */
function persistModel(obj) {
  if (obj instanceof INModelObject) {
    var inbox = obj.inbox();
    if (inbox) {
      inbox._.cache.persist(obj.id, obj.raw(), noop);
    }
  }
}


/**
 * @function
 * @name deleteModel
 *
 * @description
 * Private helper for deleting INModelObjects from the cache.
 *
 * @param {INModelObject} obj The model object to be deleted from the cache.
 */
function deleteModel(obj) {
  if (obj instanceof INModelObject) {
    var inbox = obj.inbox();
    if (inbox) {
      inbox._.cache.remove(obj.id, noop);
    }
  }
}

var _indexedDB = window.indexedDB ||
                 window.mozIndexedDB ||
                 window.webkitIndexedDB ||
                 window.msIndexedDB;

var haveIndexedDB = !!(typeof _indexedDB === 'object' &&
                    typeof _indexedDB.open === 'function');

function INIDBCache(inbox, name) {
  if (!haveIndexedDB) {
    throw new TypeError('IndexedDB is not supported in this browser.');
  }
  INCache.call(this, inbox, name);
}

if (haveIndexedDB) {
  INCache.register('indexeddb', INIDBCache);
}

function INIDBCacheDB(cache, callback) {
  if (cache._.opening) {
    cache.opening.push(callback);
  } else if (cache._.db) {
    callback(null, cache._.db);
  } else {
    cache._.opening = [];
    var req = _indexedDB.open(cache._.cacheName, 1);
    req.onerror = function(event) {
      callback(req.error, null);
    };

    req.onsuccess = function(event) {
      var db = event.target.result;

      defineProperty(cache._, 'db', INVISIBLE | WRITABLE, null, null, db);

      callback(null, db);
      while (cache._.opening.length) {
        cache.opening.shift()(null, db);
      }

      cache._.opening = false;
    };

    req.onupgradeneeded = function(event) {
      var db = event.target.result;

      var store = db.createObjectStore('resources', {
        keyPath: 'id'
      });

      store.createIndex('by_namespace', 'namespace');
      store.createIndex('by_object', 'object');

      defineProperty(cache._, 'db', INVISIBLE | WRITABLE, null, null, db);
      callback(null, db);
      while (cache._.opening.length) {
        cache.opening.shift()(null, db);
      }

      cache._.opening = false;
    };
  }
}

INIDBCache.prototype.get = function(id, callback) {
  INIDBCacheDB(this, function(err, db) {
    if (err) return callback(err, null);
    var transaction = db.transaction('resources');
    var store = transaction.objectStore('resources');
    var req = store.get(id);
    transaction.onsuccess = function() {
      callback(null, req.result);
    };

    transaction.onerror = function() {
      callback(req.error, null);
    };
  });
};

INIDBCache.prototype.getByType = function(type, callback) {
  INIDBCacheDB(this, function(err, db) {
    if (err) return callback(err, null);
    var transaction = db.transaction('resources');
    var store = transaction.objectStore('resources');
    var index = store.index('by_object');
    var req = index.openCursor(type);
    var array;

    req.onsuccess = function() {
      var cursor = req.result;

      if (cursor) {
        array = array || [];
        array.push(cursor.value);
        cursor.continue();
      } else {
        callback(null, array);
      }
    };

    req.onerror = function() {
      callback(req.error, null);
    };
  });
};

INIDBCache.prototype.persist = function(id, object, callback) {
  INIDBCacheDB(this, function(err, db) {
    if (err) return callback(err, null);
    var transaction = db.transaction('resources');
    var store = transaction.objectStore('resources', 'readwrite');
    var req = store.put(object, id);
    transaction.onsuccess = function() {
      callback(null, req.result);
    };

    transaction.onerror = function() {
      callback(req.error, null);
    };
  });
};

INIDBCache.prototype.remove = function(id, callback) {
  INIDBCacheDB(this, function(err, db) {
    if (err) return callback(err, null);
    var transaction = db.transaction('resources');
    var store = transaction.objectStore('resources', 'readwrite');
    var req = store.delete(id);
    transaction.onsuccess = function() {
      callback(null, req.result);
    };

    transaction.onerror = function() {
      callback(req.error, null);
    };
  });
};


function INStubCache(inbox) {
  INCache.call(this, inbox);
}

INCache.register('stub', INStubCache);

INStubCache.prototype.get = function(id, callback) {
  callback(null, null);
};

INStubCache.prototype.getByType = function(type, callback) {
  callback(null, null);
};

INStubCache.prototype.persist = function(id, object, callback) {
  callback(null, null);
};

INStubCache.prototype.remove = function(id, callback) {
  callback(null, null);
};

/**
 * @class INContact
 * @constructor
 * @augments INModelObject
 *
 * @description
 * Represents a contact.
 */
function INContact(inbox, id, namespaceId) {
  INModelObject.call(this, inbox, id, namespaceId);
}

inherits(INContact, INModelObject);


/**
 * @function
 * @name INContact#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INContact.resourceName = INContact.prototype.resourceName = function() {
  return 'contacts';
};


/**
 * @property
 * @name INContact#email
 *
 * The email for the contact.
 */


/**
 * @property
 * @name INContact#name
 *
 * The name of the contact.
 */

/**
 * @property
 * @name INMessage#object
 *
 * The resource type, always 'message'.
 */
defineResourceMapping(INContact, {
  'name': 'name',
  'email': 'email'
});

/**
 * @class INFile
 * @constructor
 * @augments INModelObject
 *
 * @description
 * Represents a file, which may have been attached to a draft or message, or may be being uploaded
 * locally.
 */
function INFile(inbox, id, namespaceId) {
  INModelObject.call(this, inbox, id, namespaceId);
}

inherits(INFile, INModelObject);


/**
 * @function
 * @name INFile#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INFile.resourceName = INFile.prototype.resourceName = function() {
  return 'files';
};


/**
 * @function
 * @name INFile#downloadUrl
 *
 * @description
 * Returns the URL for downloading synced File objects or attachments from the server, or NULL if
 * the file is unsynced.
 *
 * The URL is of the format <baseURL>/n/<namespaceID>/files/<fileID>/download. Note, the file need
 * not belong to a namespace associated with a downloader's own account.
 *
 * @returns {string} the URL to download the attachment or file.
 */
INFile.prototype.downloadUrl = function() {
  if (this.isUnsynced())
    return null;
  return this.resourceUrl()+'/download';
};


/**
 * @function
 * @name INFile#download
 *
 * @description
 * Downloads the file using XHR2, rather than the native browser.
 *
 * At this time, it is not possible to get progress readings from the file download.
 *
 * @returns {Promise} A promise to be fulfilled with the downloaded Blob in supporting browsers, or
 *   rejected with an error. If fulfilled with a blob, the blob may have a `fileName` property,
 *   indicating the current filename of the INFile at the time the promise was fulfilled.
 */
INFile.prototype.download = function() {
  var self = this;
  var url = this.downloadUrl();
  var filename = this.filename || this.id;
  var contentType = this.contentType || 'text/plain;charset=utf-8';

  return this.promise(function(resolve, reject) {
    apiRequest(self.inbox(), 'get', url, null, 'arraybuffer', function(err, response) {
      if (err) return reject(err);
      var blob = new Blob([response], {
        type: contentType
      });

      blob.fileName = filename;

      resolve(blob);
    });
  });
};

/**
 * @property
 * @name INFile#filename
 *
 * Filename metadata which describes the name the file should use when downloaded, and how it should
 * be visually identified in a user interface.
 */


/**
 * @property
 * @name INFile#mimetype
 *
 * Mimetype of the file resource, such as 'application/csv' or 'image/png'.
 */


/**
 * @property
 * @name INFile#messageId
 *
 * The message ID for which this file is attached.
 */


/**
 * @property
 * @name INFile#size
 *
 * File size, in bytes.
 */


/**
 * @property
 * @name INFile#isEmbedded
 *
 * Boolean value defining whether or not the file is embedded in a message.
 */


/**
 * @property
 * @name INFile#object
 *
 * The object type, which is always 'file'.
 */
defineResourceMapping(INFile, {
  'filename': 'filename',
  'contentType': 'content_type',
  'size': 'int:size',
  'messageId': 'message_id',
  'isEmbedded': 'bool:is_embedded',
  'object': 'const:file'
});


function uploadFile(namespace, fileOrFileName, fileDataOrCallback, callback) {
  if (typeof callback !== 'function') {
    callback = fileDataOrCallback;
    fileDataOrCallback = null;
  }

  var inbox = namespace.inbox();
  var url = formatUrl('%@/files/', namespace.namespaceUrl());
  var data = new window.FormData();
  if (isFile(fileOrFileName)) {
    data.append('file', fileOrFileName);
  } else if (typeof fileOrFileName === 'string' && isBlob(fileDataOrCallback)) {
    data.append('file', fileDataOrCallback, fileOrFileName);
  } else {
    return callback('not a file', null);
  }

  apiRequest(inbox, 'post', url, data, function(err, response) {
    if (err) return callback(err, null);

    // ASSERT(isArray(response) && response.length === 1)
    if (!(isArray(response) && response.length === 1)) {
      return callback(formatString('response for url `%@` must be an array.', url), null);
    }
    callback(null, makeFile(response[0]));

    function makeFile(item) {
      item = new INFile(namespace, item);
      persistModel(item);
      return item;
    }
  });
}

/**
 * @class INMessage
 * @constructor
 * @augments INModelObject
 *
 * @description
 * Represents a message associated with a thread. Messages should always be synced to the server,
 * and are not possible to construct locally.
 */
function INMessage(inbox, id, namespaceId) {
  INModelObject.call(this, inbox, id, namespaceId);
}

inherits(INMessage, INModelObject);


/**
 * @function
 * @name INMessage#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INMessage.resourceName = INMessage.prototype.resourceName = function() {
  return 'messages';
};


/**
 * @function
 * @name INMessage#thread
 *
 * @description
 * Returns a new instance of INThread, with the appropriate ID and namespaceID.
 *
 * TODO(@caitp): This is a silly operation, this should be done better. It's not a good idea to
 * construct new INThread instances all the time.
 *
 * @returns {INThread} the thread to which this message is associated.
 */
INMessage.prototype.thread = function() {
  if (!this.threadId) {
    return null;
  }

  return new INThread(this.inbox(), this.threadId, this.namespaceId);
};


/**
 * @function
 * @name INMessage#reply
 *
 * @description
 * Returns a new {INDraft} object, with recipients including the `to` and `from` recipients from
 * the message.
 *
 * TODO(caitp): remove own email address from recipients, if present.
 *
 * @returns {INDraft} the newly constructed draft message.
 */
INMessage.prototype.reply = function() {
  var draft = this.thread().reply();
  draft.addRecipients(this.from, this.to);
  return draft;
};


/**
 * @function
 * @name INMessage#attachments
 *
 * @description
 * Returns an array of INFile objects constructed from the fileData on the message.
 *
 * TODO(caitp): don't construct an unsynced INFile if we can possibly avoid it --- the caching
 * strategy should handle this properly.
 *
 * @returns {Array<INFile>} an array of INFile objects
 */
INMessage.prototype.attachments = function() {
  var inbox = this.inbox();
  var namespace = this.namespaceId;
  return map(this.fileData, function(data) {
    return new INFile(inbox, data, namespace);
  });
};


/**
 * @function
 * @name INMessage#getAttachments
 *
 * @description
 * Load INFile resources attached to the message.
 *
 * @param {Array<INMessage>|object=} optionalFilesOrFilters Optionally, either an Array of
 *   INFile objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated files, or error from
 *   the server.
 */
INMessage.prototype.getAttachments = function(optionalFilesOrFilters, filters) {
  var self = this;
  var updateFiles = null;

  if (optionalFilesOrFilters && typeof optionalFilesOrFilters === 'object') {
    if (isArray(optionalFilesOrFilters)) {
      updateFiles = optionalFilesOrFilters;
    } else {
      filters = optionalFilesOrFilters;
    }
  }

  if (!filters || typeof filters !== 'object') {
    filters = {};
  }

  filters.message_id = this.id;

  return this.promise(function(resolve, reject) {
    var url = formatUrl('%@/files%@', self.namespaceUrl(), applyFilters(filters));

    apiRequest(self.inbox(), 'get', url, function(err, response) {
      if (err) return reject(err);
      var inbox = self.inbox();
      if (updateFiles) {
        return resolve(mergeModelArray(updateFiles, response, 'id', function(data) {
          persistModel(data = new INFile(inbox, data));
          return data;
        }, INFile));
      }
      return resolve(map(response, function(data) {
        persistModel(data = new INFile(inbox, data));
        return data;
      }));
    });
  });
};


/**
 * @function
 * @name INMessage#attachment
 *
 * @description
 * Returns an INFile object for the ID at the respective index, or for the requested ID, or
 * null if the attachment is not found.
 *
 * TODO(caitp): don't construct an unsynced INFile if we can possibly avoid it --- the caching
 * strategy should handle this properly.
 *
 * @returns {INFile} an INFile object.
 */
INMessage.prototype.attachment = function(indexOrId) {
  var index;
  if (typeof indexOrId === 'number') {
    index = indexOrId >>> 0;
  } else if (typeof indexOrId === 'string') {
    var i;
    var ii = this.fileData.length;
    for (i = 0; i < ii; ++i) {
      if (indexOrId === this.fileData[i].id) {
        index = i;
        break;
      }
    }
  } else {
    throw new TypeError(
      'Cannot invoke `attachment()` on INMessage: expected attachment index or attachment ID');
  }

  if (typeof index === 'undefined') {
    return null;
  }

  var data = this.fileData[index];

  if (typeof data === 'undefined') {
    return null;
  }

  return new INFile(this.inbox(), data, this.namespaceId);
};


/**
 * @function
 * @name INMessage#markAsRead
 *
 * @description
 * Marks the message as read. This operation is saved to the server immediately. However, if the
 * message is unsynced, no request is ever made.
 *
 * @returns {Promise} a promise to be fulfilled with the INMessage object, 'this'.
 */
INMessage.prototype.markAsRead = function() {
  var self = this;
  if (this.isUnsynced()) {
    return this.promise(function(resolve) {
      self.unread = false;
      resolve(self);
    });
  }
  return apiRequestPromise(this.inbox(), 'put', this.resourceUrl(), {
    unread: false
  }, function(value) {
    self.update(value);
    return self;
  });
};


/**
 * @property
 * @name INMessage#subject
 *
 * The subject line for the message.
 */


/**
 * @property
 * @name INMessage#body
 *
 * The message body, the contents of the message.
 */


/**
 * @property
 * @name INMessage#threadId
 *
 * The threadId to which this message belongs.
 */


/**
 * @property
 * @name INMessage#date
 *
 * The date and time at which the message was sent.
 */


/**
 * @property
 * @name INMessage#from
 *
 * An array of Participant objects, each element containing string 'name' and string 'email'. These
 * are used to identify the senders of the message.
 */


/**
 * @property
 * @name INMessage#to
 *
 * An array of Participant objects, each element containing string 'name' and string 'email'. These
 * are used to identify the recipients of the message.
 */


/**
 * @property
 * @name INMessage#unread
 *
 * A boolean flag --- true if the message has not yet been marked as read (see
 * {INMessage#markAsRead}), or false if the message has been marked.
 */


/**
 * @property
 * @name INMessage#fileData
 *
 * An array of the raw attachment JSON blocks, representing the files attached to this message.
 * See the attachments() method for INFile objects instead.
 */


/**
 * @property
 * @name INMessage#object
 *
 * The resource type, always 'message'.
 */
defineResourceMapping(INMessage, {
  'subject': 'subject',
  'body': 'body',
  'threadId': 'thread_id',
  'date': 'date:date',
  'from': 'array:from',
  'to': 'array:to',
  'cc': 'array:cc',
  'bcc': 'array:bcc',
  'unread': 'bool:unread',
  'fileData': 'array:files',
  'object': 'const:message'
});

/**
 * @class INDraft
 * @constructor
 * @augments INMessage
 *
 * @description
 * Represents a draft message, which may or may not be synced to the server. Drafts are typically
 * created with {INMessage#reply}, {INThread#reply}, or {INNamespace#draft}.
 *
 * The draft-message may be sent without being synced to the server.
 */
function INDraft(inbox, id, namespaceId) {
  INMessage.call(this, inbox, id, namespaceId);
}

inherits(INDraft, INMessage);


/**
 * @function
 * @name INDraft#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INDraft.resourceName = INDraft.prototype.resourceName = function() {
  return 'drafts';
};


INDraft.prototype.raw = function() {
  // check the formatting of our participants fields. They must be either undefined or be
  // arrays, and must contain objects that have an email key
  var keys = ['from', 'to', 'cc', 'bcc'];
  for (var i = 0, ii = keys.length; i < ii; ++i) {
    var list = this[keys[i]];
    var valid = false;

    if (isArray(list)) {
      valid = true;
      for (var j = 0, jj = list.length; j < jj; ++j) {
        if ((typeof list[j] !== 'object') || (!list[j].hasOwnProperty('email'))) {
          valid = false;
          break;
        }
      }
    } else if (list === undefined) {
      valid = true;
    }

    if (!valid) {
      throw new TypeError(
      'INDraft.save(): To, From, CC, BCC must be arrays of objects with emails and optional names.');
    }
  }

  var out = INMessage.prototype.raw.call(this);
  out.file_ids = map(this.fileData, function(data) {
    return data.id;
  });

  return out;
};
/**
 * @function
 * @name INDraft#addRecipients
 *
 * @description
 * Adds a set of participants to {INDraft#to} --- the set of direct message recipients. These are
 * not CC'd or BCC'd.
 *
 * @param {Array<Object>} participants an array of Participant objects, containing keys 'name' and
 *   'email'. The name should be a name which identifies the recipient, and the email should be
 *   their email address.
 *
 * @returns {INDraft} the INDraft object, 'this', to enable chaining calls.
 */
INDraft.prototype.addRecipients = function(participants) {
  var to = this.to || (this.to = []);
  var i;
  var ii = arguments.length;
  var item;
  for (i = 0; i < ii; ++i) {
    item = arguments[i];
    if (isArray(item)) {
      mergeModelArray(to, item, 'email');
    }
  }
  return this;
};


/**
 * @function
 * @name INDraft#uploadAttachment
 *
 * @description
 * Uploads a file to the server, and adds the attachment ID from the response to the end of the
 * set of attachment IDs.
 *
 * Uploading files requires that the browser support the FormData object, or a working polyfill.
 * It also requires support for the Blob type. See http://caniuse.com/xhr2 for browser support.
 *
 * Support for legacy browsers may be possible using Flash, or clever hacks with iframes.
 *
 * @param {string|File} fileNameOrFile Either a File object. A File object is essentially a
 *   Blob with metadata (filename, mimetype). If the fileNameOrFile parameter is a File, then
 *   the second parameter may be ignored. Otherwise, if it is a string, it is treated as the
 *   filename for the associated blob object.
 * @param {Blob=} blobForFileName A Blob object containing the data to be uploaded to the
 *   server.
 *
 * @returns {Promise} a promise to be fulfilled with the response from the server, or an
 *   exception which may be thrown.
 */
INDraft.prototype.uploadAttachment = function(fileNameOrFile, blobForFileName) {
  var namespace = this.namespace();
  var self = this;
  return this.promise(function(resolve, reject) {
    uploadFile(self, fileNameOrFile, blobForFileName, function(err, response) {
      if (err) {
        if (typeof err == 'string') {
          err = new Error('Cannot invoke `uploadAttachment()` on INDraft: ' + err);
        }
        return reject(err);
      }
      self.fileData.push(response);
      return resolve(response);
    });
  });
};


/**
 * @function
 * @name INDraft#removeAttachment
 *
 * @description
 * Removes an attachment ID from a draft message, and prevents the attachment from being
 * associated with the message.
 *
 * @param {string|INFile} file Either a file ID as a string, or an INFile object.
 *
 * @returns {INDraft} the INDraft object, 'this', to enable chaining calls.
 */
INDraft.prototype.removeAttachment = function(file) {
  if (!file) {
    throw new TypeError(
      'Cannot invoke `removeAttachment()` on INDraft: file must be a file ID or object');
  }
  var id = typeof file === 'string' ? file : file.id;
  var i;
  var ii = this.fileData.length;

  for (i = 0; i < ii; ++i) {
    if (this.fileData[i].id === id) {
      this.fileData.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * @function
 * @name INDraft#addAttachment
 *
 * @description
 * Adds an attachment which has already been uploaded to the server.
 *
 * @param {response} the response object returned by the API
 */
INDraft.prototype.addAttachment = function(file) {
  if (!file || typeof file !== 'object' || !file.id) {
    throw new TypeError(
      'Cannot invoke `addAttachment` on INDraft: file must be an object with an ID');
  }
  this.fileData.push(file);
};

/**
 * Shadow INMessage#markAsRead method with 'null', because it is meaningless for draft messages.
 */
INDraft.prototype.markAsRead = null;


/**
 * @function
 * @name INDraft#save
 *
 * @description
 * Save the draft to the server
 *
 * @returns {Promise} promise to be fulfilled with either an API response from the server, or
 *   an exception thrown by apiRequest().
 */
INDraft.prototype.save = function() {
  var pattern = this.isUnsynced() ? '%@/drafts' : '%@/drafts/%@';
  var url = formatUrl(pattern, this.namespaceUrl(), this.id);
  var inbox = this.inbox();
  var json = toJSON(this.raw());
  var self = this;

  return this.promise(function(resolve, reject) {
    apiRequest(inbox, self.isUnsynced() ? 'post' : 'put', url, json, function(err, response) {
      if (err) return reject(err);
      // Should delete the cached version, if any
      self.update(response);
      deleteModel(self);
      persistModel(self);
      resolve(self);
    });
  });
};


/**
 * @function
 * @name INDraft#send
 *
 * @description
 * Send a draft message to recipients. The draft does not need to be saved to the server before
 * performing this task.
 *
 * @returns {Promise} promise to be fulfilled with the API response from the server, or an
 *   exception which may have been thrown.
 */
INDraft.prototype.send = function() {
  var data;
  var inbox = this.inbox();
  var url = formatUrl('%@/send', this.namespaceUrl());

  if (this.isUnsynced()) {
    // Send the message object in the request
    data = this.raw();
    delete data.id;
    delete data.object;

  } else {
    // Send the message ID in the request
    data = {
      'draft_id': this.id,
      'version': this.version
    };
  }

  return this.promise(function(resolve, reject) {
    apiRequest(inbox, 'post', url, toJSON(data), function(err, response) {
      // TODO: update a 'state' flag indicating that the value has been saved
      if (err) return reject(err);
      resolve(response);
    });
  });
};


/**
 * @function
 * @name INDraft#dispose
 *
 * @description
 * Delete the draft from both local cache and the server.
 *
 * @returns {Promise} promise fulfilled with either an error from the API, or with the draft itself.
 */
INDraft.prototype.dispose = function() {
  var self = this;
  return this.promise(function(resolve, reject) {
    deleteModel(self);
    if (self.isUnsynced()) {
      // Cached copy is already deleted --- just resolve.
      resolve(self);
    } else {
      apiRequest(self.inbox(), 'delete', self.resourceUrl(), toJSON({version: self.version}),
      function(err, response) {
        if (err) return reject(err);
        resolve(self);
      });
    }
  });
};


/**
 * @property
 * @name INDraft#state
 *
 * If present, this is the state of the draft (`draft`, `sending`, or `sent`).
 */


/**
 * @property
 * @name INDraft#object
 *
 * The resource type, always 'draft'.
 */
defineResourceMapping(INDraft, {
  'state': 'state',
  'version': 'version',
  'object': 'const:draft'
}, INMessage);

/**
 * @class INNamespace
 * @constructor
 * @augments INModelObject
 *
 * @description
 * A namespace object, essentially representing an email address, and a facet of an Inbox account,
 * which can send and receive messages for the associated email address.
 */
function INNamespace(inbox, id) {
  INModelObject.call(this, inbox, id);
  this._.namespace = this;
  this.namespaceId = this.id;
}

inherits(INNamespace, INModelObject);


/**
 * @function
 * @name INNamespace#namespace
 *
 * @description
 * Overload of {INModelObject#namespace} which always returns the value 'this'. The overloaded
 * method is provided to avoid getting stuck in circular traversal.
 *
 * @returns {INNamespace} this
 */
INNamespace.prototype.namespace = function() {
  return this;
};

/**
 * @function
 * @name INNamespace#namespaceUrl
 *
 * @description
 * Overload of {INModelObject#namespace} which always returns the value 'this'. The overloaded
 * method is provided to avoid getting stuck in circular traversal.
 *
 * @returns {INNamespace} this
 */
INNamespace.prototype.namespaceUrl = function() {
  return this.resourceUrl();
};


/**
 * @function
 * @name INNamespace#resourceUrl
 *
 * @description
 * Returns the URL for the namespace
 *
 * @returns {string} the resource path of the file.
 */
INNamespace.prototype.resourceUrl = function() {
  if (this.isUnsynced())
    return null;
  return formatUrl('%@/%@/%@', this.baseUrl(), this.resourceName(), this.id);
};


/**
 * @function
 * @name INNamespace#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INNamespace.resourceName = INNamespace.prototype.resourceName = function() {
  return 'n';
};


/**
 * @property
 * @name INNamespace#emailAddress
 *
 * The email address associated with this namespace. The raw value for this property is
 * 'email_address'.
 */


/**
 * @property
 * @name INNamespace#account
 *
 * An account ID, to which the namespace is associated.
 */


/**
 * @property
 * @name INNamespace#provider
 *
 * A string representing the Provider --- typically 'Gmail' or 'yahoo' or similar.
 */


/**
 * @property
 * @name INNamespace#status
 *
 * Unused, currently.
 */


/**
 * @property
 * @name INNamespace#scope
 *
 * Unused, currently.
 */


/**
 * @property
 * @name INNamespace#lastSync
 *
 * Unused, currently.
 */


/**
 * @property
 * @name INNamespace#object
 *
 * The resource type, always 'namespace'.
 */
defineResourceMapping(INNamespace, {
  'emailAddress': 'email_address',
  'account': 'account',
  'provider': 'provider',
  'status': 'status',
  'scope': 'scope',
  'lastSync': 'last_sync',
  'object': 'const:namespace'
});


/**
 * @function
 * @name INNamespace#threads
 *
 * @description
 * A method which fetches threads from the server, optionally updating an array of threads, and
 * optionally filtered. If either filters or optional threads are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INThread>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INThread objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated threads, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.threads = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INThread, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#thread
 *
 * @description
 * Fetch a thread by ID from either the cache or server. The resolved INThread object may be stale.
 *
 * TODO(@caitp): provide a way to determine whether the fetched resource is fresh or stae.
 *
 * @param {string} threadId the ID of the thread to fetch.
 *
 * @returns {Promise} a promise which is fulfilled with either a new INThread instance, or an error
 *   from the cache subsystem or server.
 */
INNamespace.prototype.thread = function(threadId) {
  var self = this;
  var inbox = this.inbox();
  var cache = inbox._.cache;
  if (!arguments.length) {
    throw new TypeError(
      'Unable to perform `thread()` on INNamespace: missing option `threadId`.');
  } else if (typeof threadId !== 'string') {
    throw new TypeError(
      'Unable to perform `thread()` on INNamespace: threadId must be a string.');
  }
  return this.promise(function(resolve, reject) {
    cache.get(threadId, function(err, obj) {
      if (err) return reject(err);
      if (obj) return threadReady(null, obj);
      apiRequest(inbox, 'get', formatUrl('%@/threads/%@', self.namespaceUrl(), threadId),
        threadReady);

      function threadReady(err, data) {
        if (err) return reject(err);
        cache.persist(threadId, data, noop);
        resolve(new INThread(self, data));
      }
    });
  });
};

/**
 * @function
 * @name INNamespace#contacts
 *
 * @description
 * A method which fetches contacts from the server, optionally updating an array of contacts, and
 * optionally filtered. If either filters or optional contacts are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INContact>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INContact objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated threads, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.contacts = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INContact, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#tags
 *
 * @description
 * A method which fetches tags from the server, optionally updating an array of tags, and
 * optionally filtered. If either filters or optional tags are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INTag>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INTag objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated tags, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.tags = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INTag, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#drafts
 *
 * @description
 * A method which fetches drafts from the server, optionally updating an array of drafts, and
 * optionally filtered. If either filters or optional drafts are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INDraft>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INTag objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated drafts, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.drafts = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INDraft, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#draft
 *
 * @description
 * Returns a new {INDraft} object, enabling the caller to create a new message to send. This is the
 * primary API for sending messages with Inbox.js.
 *
 * @returns {INDraft} the newly constructed INDraft object.
 */
INNamespace.prototype.draft = function() {
  return new INDraft(this, null);
};


/**
 * @function
 * @name INNamespace#files
 *
 * @description
 * A method which fetches files from the server, optionally updating an array of drafts, and
 * optionally filtered. If either filters or optional drafts are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INFile>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INTag objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated drafts, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.files = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INFile, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#messages
 *
 * @description
 * A method which fetches messages from the server, optionally updating an array of drafts, and
 * optionally filtered. If either filters or optional drafts are provided, the system will not
 * use the cache and go directly to the server.
 *
 * @param {Array<INMessage>|object=} existingArrayOrFilters Optionally, either an Array of
 *   INTag objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated drafts, or error from
 *   the cache subsystem or from the server.
 */
INNamespace.prototype.messages = function(existingArrayOrFilters, filters) {
  return this.fetchCollection(INMessage, existingArrayOrFilters, filters);
};


/**
 * @function
 * @name INNamespace#fetchCollection
 *
 * @description
 * A method which fetches a collection of items from the server, optionally updating an existing array and
 * optionally filtered. If either filters or optional existing array are provided, the system will not
 * use the cache and go directly to the server.
 *
*/
INNamespace.prototype.fetchCollection = function(klass, existingArrayOrFilters, filters) {
  var self = this;
  var inbox = this.inbox();
  var cache = inbox._.cache;
  var existingArray = null;

  if (existingArrayOrFilters && typeof existingArrayOrFilters === 'object') {
    if (isArray(existingArrayOrFilters)) {
      existingArray = existingArrayOrFilters;
    } else if (!filters) {
      filters = existingArrayOrFilters;
    }
  }
  if (filters && typeof filters !== 'object') {
    filters = null;
  }

  return this.promise(function(resolve, reject) {
    // note: we don't currently support caching when there are filters
    if (existingArray || filters) {
      var url = formatUrl('%@/%@%@', self.resourceUrl(), klass.resourceName(), applyFilters(filters));
      return apiRequest(inbox, 'get', url, responseReady);
    } else {
      cache.getByType('namespace', function(err, returnedArray) {
        if (err) return reject(err);
        if (returnedArray && returnedArray.length) return responseReady(null, returnedArray);
        var url = formatUrl('%@/%@', self.resourceUrl(), klass.resourceName());
        apiRequest(inbox, 'get', url, responseReady);
      });
    }

    function responseReady(err, returnedArray) {
      if (err) return reject(err);

      var constructor = function(item) {
        cache.persist(item.id, item, noop);
        return new klass(self, item);
      };

      if (existingArray) {
        return resolve(mergeModelArray(existingArray, returnedArray, 'id', constructor));
      } else {
        return resolve(map(returnedArray, constructor));
      }
    }
  });
};


/**
 * @function
 * @name INNamespace#uploadFile
 *
 * @description
 * Method for uploading a file to the server. The uploaded file is not attached to a message
 * immediately, but the caller has the option of attaching it to a message manually using the
 * applicable {INDraft} methods.
 *
 * @param {string|File} fileNameOrFile Either a File object. A File object is essentially a
 *   Blob with metadata (filename, mimetype). If the fileNameOrFile parameter is a File, then
 *   the second parameter may be ignored. Otherwise, if it is a string, it is treated as the
 *   filename for the associated blob object.
 * @param {Blob=} blobForFileName A Blob object containing the data to be uploaded to the
 *   server.
 *
 * @returns {Promise} a promise to be fulfilled with the response from the server, or an
 *   exception which may be thrown.
 */
INNamespace.prototype.uploadFile = function(fileNameOrFile, blobForFileName) {
  var self = this;
  return this.promise(function(resolve, reject) {
    uploadFile(self, fileNameOrFile, blobForFileName, function(err, response) {
      if (err) {
        if (typeof err == 'string') {
          err = new Error('Cannot invoke `uploadFile()` on INNamespace: ' + err);
        }
        return reject(err);
      }
      return resolve(response);
    });
  });
};


/**
 * @function
 * @name getNamespace
 * @private
 *
 * @description
 * This routine is not spectacularly useful, and needs to be replaced with a better mechanism. At
 * the moment, it will only construct a new INNamespace, but ideally it should return the current
 * instance of the namespace with the correct namespace ID, or pull it from the cache if necessary.
 *
 * If the namespace can't be found from the cache, only then should it construct a new instance.
 */
function getNamespace(inbox, namespaceId) {
  // TODO(@caitp): we should use LRU cache or something here, but since there's no way to know when
  // namespaces are collected, it's probably better to just create a new instance all the time.
  return new INNamespace(inbox, namespaceId);
}

/**
 * @class INTag
 * @constructor
 * @augments INModelObject
 *
 * @description
 * A small resource representing a Tag object from the Inbox API.
 */
function INTag(inbox, id, namespaceId) {
  INModelObject.call(this, inbox, id, namespaceId);
}

inherits(INTag, INModelObject);


/**
 * @function
 * @name INTag#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INTag.resourceName = INTag.prototype.resourceName = function() {
  return 'tags';
};


var localizedTagNames = {
  'archive': 'Archive',
  'inbox': 'Inbox',
  'unread': 'Unread',
  'sent': 'Sent',
  'starred': 'Starred'
};


/**
 * @function
 * @name INTag#name
 *
 * @description
 * Returns the tag name, with the first letter of each word capitalized.
 *
 * TODO(@caitp): support returning localized tag names. Currently, the placeholder fakes
 * localization, but it should be possible to localize for real.
 *
 * @returns {string} the capitalized tag name.
 */
INTag.prototype.name = function() {
  if (hasProperty(localizedTagNames, this.tagName)) {
    return localizedTagNames[this.tagName];
  }
  return capitalizeString(this.tagName);
};


/**
 * @function
 * @name INTag#threads
 *
 * @description
 * A method which fetches threads from the server, optionally updating an array of threads, and
 * optionally filtered. If either filters or optional threads are provided, the system will not
 * use the cache and go directly to the server.
 *
 * This method automatically defers to {INNamespace#threads}, filtering by the current tagname.
 *
 * @param {Array<INThread>|object=} optionalThreadsOrFilters Optionally, either an Array of
 *   INThread objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated threads, or error from
 *   the cache subsystem or from the server.
 */
INTag.prototype.threads = function(optionalThreadsOrFilters, filters) {
  var namespace = this.namespace();
  var updateThreads = null;

  if (!namespace) return this.promise(function(resolve, reject) {
    reject(new Error('Cannot invoke `threads()` on INTag: not attached to a namespace.'));
  });

  if (optionalThreadsOrFilters && typeof optionalThreadsOrFilters === 'object') {
    if (isArray(optionalThreadsOrFilters)) {
      updateThreads = optionalThreadsOrFilters;
    } else {
      filters = optionalThreadsOrFilters;
    }
  }
  if (!filters || typeof filters !== 'object') {
    filters = {};
  }
  filters.tag = this.id;
  return namespace.threads(updateThreads, filters);
};


/**
 * @property
 * @name INTag#tagName
 *
 * The un-localized name of the tag. Custom tag-names are prefixed with the provider they are
 * associated with. TODO(@caitp): provide an accessor for the provider-prefixed tag name.
 */


/**
 * @property
 * @name INTag#object
 *
 * The resource type, always 'tag'.
 */
defineResourceMapping(INTag, {
  'tagName': 'name',
  'object': 'const:tag'
});

/**
 * @class INThread
 * @constructor
 * @augments INModelObject
 *
 * @description
 * Model representing a single Thread.
 */
function INThread(inbox, id, namespaceId) {
  INModelObject.call(this, inbox, id, namespaceId);
}

inherits(INThread, INModelObject);


/**
 * @function
 * @name INThread#resourceName
 *
 * @description
 * Returns the name of the resource used when constructing URLs
 *
 * @returns {string} the resource path of the file.
 */
INThread.resourceName = INThread.prototype.resourceName = function() {
  return 'threads';
};


/**
 * @function
 * @name INThread#reply
 *
 * @description
 * Returns a new {INDraft} object in reply to this thread.
 *
 * @returns {INDraft} the newly constructed draft message.
 */
INThread.prototype.reply = function() {
  var data = this.raw();
  delete data.id;
  var draft = new INDraft(this.namespace(), data);
  draft.threadId = this.id;
  return draft;
};


/**
 * @function
 * @name INThread#messages
 *
 * @description
 * A method which fetches messages from the server, associated with the thread on which the method
 * is invoked, optionally updating an array of messages, and optionally filtered.
 *
 * It is not currently possible to fetch messages associated with a particular thread from the
 * cache. TODO(@caitp): this should be possible.
 *
 * @param {Array<INMessage>|object=} optionalMessagesOrFilters Optionally, either an Array of
 *   INMessage objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated messages, or error from
 *   the server.
 */
INThread.prototype.messages = function(optionalMessagesOrFilters, filters) {
  return this.namespace().fetchCollection(INMessage, {threadId: this.id});
};


/**
 * @function
 * @name INThread#drafts
 *
 * @description
 * A method which fetches drafts from the server, associated with the thread on which the method
 * is invoked, optionally updating an array of drafts, and optionally filtered.
 *
 * It is not currently possible to fetch drafts associated with a particular thread from the
 * cache. TODO(@caitp): this should be possible.
 *
 * @param {Array<INMessage>|object=} optionalDraftsOrFilters Optionally, either an Array of
 *   INDraft objects to be updated with the response, or an object containing filters to apply
 *   to the URL.
 * @param {object=} filters An optional object containing filters to apply to the URL.
 *
 * @returns {Promise} a promise to be fulfilled with the new or updated messages, or error from
 *   the server.
 */
INThread.prototype.drafts = function(optionalDraftsOrFilters, filters) {
  return this.namespace().fetchCollection(INDraft, {threadId: this.id});
};


/**
 * @function
 * @name INThread#updateTags
 *
 * @description
 * A method which makes a request with method PUT to the endpoint
 * `/n/<namespace_id>/threads/<thread_id>` with keys `add_tags` and `remove_tags`, and expects a
 * successful response to be the updated Thread model value.
 *
 * @param {Array<string>} addTags A collection of tag names to be added to the thread.
 * @param {Array<string>} removeTags A collection of tag names to be removed from the thread.
 *
 * @returns {Promise} a promise to be fulfilled with the Thread after having been updated
 */
INThread.prototype.updateTags = function(addTags, removeTags) {
  var self = this;
  var url = formatUrl('%@/threads/%@', this.namespaceUrl(), this.id);
  if (!isArray(addTags)) addTags = [];
  if (!isArray(removeTags)) removeTags = [];

  return this.promise(function(resolve, reject) {
    apiRequest(self.inbox(), 'put', url, toJSON({
      'add_tags': addTags,
      'remove_tags': removeTags
    }), function(err, thread) {
      if (err) return reject(err);
      self.update(thread);
      persistModel(self);
      resolve(self);
    });
  });
};


/**
 * @function
 * @name INThread#addTags
 *
 * @description
 * A method which makes a request with method PUT to the endpoint
 * `/n/<namespace_id>/threads/<thread_id>` with keys `add_tags` and `remove_tags`, and expects a
 * successful response to be the updated Thread model value.
 *
 * Convenience method which invokes INThread#updateTags.
 *
 * @param {Array<string>} addTags A collection of tag names to be added to the thread.
 *
 * @returns {Promise} a promise to be fulfilled with the Thread after having been updated
 */
INThread.prototype.addTags = function(addTags) {
  return this.updateTags(addTags, null);
};


/**
 * @function
 * @name INThread#removeTags
 *
 * @description
 * A method which makes a request with method PUT to the endpoint
 * `/n/<namespace_id>/threads/<thread_id>` with keys `add_tags` and `remove_tags`, and expects a
 * successful response to be the updated Thread model value.
 *
 * Convenience method which invokes INThread#updateTags.
 *
 * @param {Array<string>} removeTags A collection of tag names to be removed from the thread.
 *
 * @returns {Promise} a promise to be fulfilled with the Thread after having been updated
 */
INThread.prototype.removeTags = function(removeTags) {
  return this.updateTags(null, removeTags);
};


/**
 * @function
 * @name INThread#hasTag
 *
 * @description
 * Searches the thread's tagData collection for a tag with the specified tag name. The search is
 * case-sensitive.
 *
 * @param {Array<string>} tagName Name of a tag to search for within the thread's tagData
 *   collection.
 *
 * @returns {boolean} Returns true if the tag name is present within the thread, otherwise
 *   false.
 */
INThread.prototype.hasTag = function(tagName) {
  for (var i = 0; i < this.tagData.length; ++i) {
    var tag = this.tagData[i];
    if (tag && (tag.tagName === tagName || tag.name === tagName)) {
      return true;
    }
  }
  return false;
};

/**
 * @property
 * @name INThread#subject
 *
 * The subject line for the thread.
 */


/**
 * @property
 * @name INThread#subjectDate
 *
 * The message date of the first message in the thread.
 */


/**
 * @property
 * @name INThread#participants
 *
 * An array of Participant objects representing accounts who have participated in the thread. Each
 * element of the array has the properties 'name' and 'email'.
 */


/**
 * @property
 * @name INThread#lastMessageDate
 *
 * The date of the most recent message in the thread.
 */


/**
 * @property
 * @name INThread#messageIDs
 *
 * An array of strings, each element of the array representing a single INMessage ID.
 */


/**
 * @property
 * @name INThread#draftIDs
 *
 * An array of strings, each element of the array representing a single INDraft ID.
 */


/**
 * @property
 * @name INThread#tagData
 *
 * An array of Tag objects (not INTag resources).
 */


/**
 * @property
 * @name INThread#snippet
 *
 * A string containing a short snippet of text from the thread, useful for user interfaces.
 */


/**
 * @property
 * @name INThread#object
 *
 * The resource type, always 'thread'.
 */
defineResourceMapping(INThread, {
  'subject': 'subject',
  'subjectDate': 'date:subject_date',
  'participants': 'array:participants',
  'lastMessageDate': 'date:last_message_timestamp',
  'messageIDs': 'array:message_ids',
  'draftIDs': 'array:draft_ids',
  'tagData': 'array:tags',
  'snippet': 'snippet',
  'object': 'const:thread'
});

function setup(window, angular) {
  var module =
angular.module('inbox', []).
  provider('$inbox', function() {
    var config = {
      baseUrl: null,
      http: {
        headers: {},
        withCredentials: false
      }
    };

    this.baseUrl = function(value) {
      if (arguments.length >= 1) {
        config.baseUrl = typeof value === 'string' ? value : null;
        return this;
      }
      return config.baseUrl;
    };

    this.appId = function(value) {
      if (arguments.length >= 1) {
        config.appId = '' + value;
        return this;
      }
      return config.appId;
    };

    this.withCredentials = function(value) {
      if (!arguments.length) {
        return config.http.withCredentials;
      }
      config.http.withCredentials = !!value;
      return this;
    };

    this.setRequestHeader = function(header, value) {
      if (arguments.length > 1) {
        header = ('' + header).toLowerCase();
        if (HEADER_REGEXP.test(header)) {
          config.http.headers[header] = value;
        }
      }
      return this;
    };

    this.InboxAPI = InboxAPI;
    InboxAPI.INContact = INContact;
    InboxAPI.INDraft = INDraft;
    InboxAPI.INFile = INFile;
    InboxAPI.INMessage = INMessage;
    InboxAPI.INNamespace = INNamespace;
    InboxAPI.INTag = INTag;
    InboxAPI.INThread = INThread;

    this.$get = ['$q', function($q) {
      var tempConfig;
      var Promise = function(resolver) {
        if (typeof resolver !== 'function') {
          throw new TypeError('resolver must be a function');
        }
        var deferred = $q.defer();
        resolver(function(value) {
          deferred.resolve(value);
        }, function(reason) {
          deferred.reject(reason);
        });
        return deferred.promise;
      };
      tempConfig = angular.extend({promise: Promise}, config);
      return new InboxAPI(tempConfig);
    }];
  });

  return module;
}

if (typeof angular === 'object' && angular && typeof angular.module === 'function') {
  // AngularJS already loaded, register Inbox modules
  setup(window, angular);
} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
  // RequireJS
  // TODO: don't assume AngularJS module is named 'angular'
  define(['angular'], function(angular) {
    return setup(window, angular);
  });
} else if (typeof module === 'object' && typeof require === 'function') {
  // CommonJS/Browserify
  // TODO: don't assume AngularJS module is named 'angular'
  var commonjsAngular = require('angular');
  module.exports = setup(window, commonjsAngular);
}

})(this);
