/* jshint latedef:false */

var indexof = require('indexof');
var extend = require('xtend');
var now = require('date-now');
var patch = require('console-patch');
var pinghome = require('ping-home');

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
