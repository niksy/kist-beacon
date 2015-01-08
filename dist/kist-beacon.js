/*! kist-beacon 0.3.0 - Front-end logging interface. | Author: Ivan Nikolić <niksy5@gmail.com> (http://ivannikolic.com/), 2015 | License: MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.kist||(f.kist={})).Beacon=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/* jshint latedef:false */

var indexof = require(5);
var extend = require(8);
var now = require(4);
var patch = require(2);
var pinghome = require(6);

var consoleIntercepted = false;
var queue = {
	'js': [],
	'console': []
};

function interceptConsole () {

	var methods = [];

	if ( !global.console || consoleIntercepted ) {
		return;
	}
	consoleIntercepted = true;

	patch(function ( args ) {
		for ( var i = 0, queueLength = queue['console'].length; i < queueLength; i++ ) {
			sendConsole.call(queue['console'][i], args.method, args.arguments);
		}
	});

}

/**
 * @param  {String} errorMessage
 * @param  {String} url
 * @param  {Integer} lineNumber
 */
function KistBeaconOnError ( errorMessage, url, lineNumber ) {
	if ( origOnError ) {
		origOnError.apply(global, arguments);
	}
	for ( var i = 0, queueLength = queue.js.length; i < queueLength; i++ ) {
		sendJS.apply(queue.js[i], arguments);
	}
	return false;
}
var origOnError = global.onerror;
global.onerror = KistBeaconOnError;

/**
 * Generate data for sending via AJAX call
 *
 * @param  {Object} data
 *
 * @return {Object}
 */
function generate ( data ) {
	return extend({},{
		logType: 'Generic',
		userAgent: navigator.userAgent,
		time: now()
	}, data);
}

/**
 * @param  {String} errorMessage
 * @param  {String} url
 * @param  {String} lineNumber
 *
 * @return {Object}
 */
function sendJS ( errorMessage, url, lineNumber ) {
	return this.send(generate({
		logType: 'JS Error',
		errorMessage: errorMessage,
		url: url,
		lineNumber: lineNumber
	}));
}

/**
 * @param  {String} method
 * @param  {String} message
 *
 * @return {Object}
 */
function sendConsole ( method, message ) {
	return this.send(generate({
		logType: 'Console call',
		methodType: method,
		url: location.href,
		message: message
	}));
}

/**
 * @class
 *
 * @param {Object} options
 */
var Beacon = module.exports = function ( options ) {

	var type = [];

	this.options = extend({}, this.defaults, options);

	for ( var prop in this.options ) {
		if (
			this.options.hasOwnProperty(prop) &&
			(prop === 'console' || prop === 'js')
		) {
			if ( this.options[prop] ) {
				type.push(prop);
			}
		}
	}

	// Setup events
	for ( var i = 0, typeLength = type.length; i < typeLength; i++ ) {
		queue[type[i]].push(this);
	}

	if ( this.options['console'] ) {
		interceptConsole();
	}

};

Beacon.prototype.defaults = {
	'url': '',
	'js': true,
	'console': false
};

/**
 * @param  {Object} data
 */
Beacon.prototype.send = function ( data ) {
	pinghome(this.options.url, generate(data));
};

Beacon.prototype.destroy = function () {
	var index;
	var queueItem;
	for ( var prop in queue ) {
		if ( queue.hasOwnProperty(prop) ) {
			queueItem = queue[prop];
			index = indexof(queueItem, this);
			if ( index !== -1 ) {
				queueItem.splice(index, 1);
			}
		}
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
var foreach = require(3);
module.exports = function(onConsole) {
  var methods = []
  for (var key in console) methods.push(key)
  foreach(methods, function(method) {
    var orig = console[method]
    var proxy = function consoleProxy() {
      var args = [].slice.call(arguments)
      onConsole({method: method, arguments: args})
      if ( orig.apply ) {
        // Do this for normal browsers
        orig.apply(console, args)
      } else {
        // Do this for IE
        orig([].slice.apply(args).join(' '));
      }
    }
    console[method] = proxy
  })
}

},{}],3:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],4:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],5:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],6:[function(require,module,exports){
(function (global){
var qs = require(7);

/**
 * @param  {Object} data
 * @param  {Boolean} useQs
 *
 * @return {String|FormData}
 */
function prepare ( data, useQs ) {
	var ret;
	if ( !('FormData' in global) || useQs ) {
		ret = qs(data);
	} else {
		ret = new FormData();
		for ( var prop in data ) {
			if ( data.hasOwnProperty(prop) ) {
				ret.append(prop, data[prop]);
			}
		}
	}
	return ret;
}

/**
 * @param  {String} url
 * @param  {Object} data
 * @param  {Boolean} useSync
 */
module.exports = function ( url, data, useSync ) {
	if ( navigator.sendBeacon ) {
		navigator.sendBeacon(url, prepare(data));
	} else {
		var xhr = ('XMLHttpRequest' in global) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
		xhr.open('POST', url, (useSync ? false : true));
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.send(prepare(data, true));
	}
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],8:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1])(1)
});