/*! kist-beacon 0.2.3 - Front-end logging interface. | Author: Ivan Nikolić <niksy5@gmail.com> (http://ivannikolic.com/), 2014 | License: MIT */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),(f.kist||(f.kist={})).Beacon=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/* jshint latedef:false */

var indexof = require(5);
var qs = require(6).stringify;
var extend = require(8);
var now = require(4);
var patch = require(2);

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
 *
 * @return {Object}
 */
Beacon.prototype.send = function ( data ) {
	var xhr = global.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('POST', this.options.url, true);
	xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	xhr.send(qs(generate(data)));
	return data;
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

/**
 * Module dependencies.
 */

var trim = require(7);

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' != typeof str) return {};

  str = trim(str);
  if ('' == str) return {};

  var obj = {};
  var pairs = str.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    obj[parts[0]] = null == parts[1]
      ? ''
      : decodeURIComponent(parts[1]);
  }

  return obj;
};

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
};

},{}],7:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
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