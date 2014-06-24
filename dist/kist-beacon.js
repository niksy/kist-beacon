/*! kist-beacon 0.2.0 - Front-end logging interface. | Author: Ivan Nikolić, 2014 | License: MIT */
;(function ( window, document, undefined ) {

	var consoleIntercepted = false;
	var queue = {
		js: [],
		'console': [],
	};

	var events = {

		/**
		 * @this {Beacon}
		 *
		 * @param  {Array} type
		 *
		 * @return {}
		 */
		setup: function ( type ) {
			for ( var i = 0, typeLength = type.length; i < typeLength; i++ ) {
				queue[type[i]].push(this);
			}
		},
		/**
		 * @this {Beacon}
		 *
		 * @param  {Array} type
		 *
		 * @return {}
		 */
		destroy: function () {

			var index;
			var queueItem;

			for ( var prop in queue ) {
				if ( queue.hasOwnProperty(prop) ) {
					queueItem = queue[prop];
					index = indexOf(queueItem, this);
					if ( index !== -1 ) {
						queueItem.splice(index, 1);
					}
				}
			}

		}
	};

	/**
	 * @param  {Array} arr
	 * @param  {Object} obj
	 *
	 * @return {Integer}
	 */
	function indexOf ( arr, obj ) {
		if ( arr.indexOf ) {
			return arr.indexOf(obj);
		}
		for ( var i = 0; i < arr.length; ++i ) {
			if ( arr[i] === obj ) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * @param  {Object} obj
	 *
	 * @return {Object}
	 */
	function extend ( obj ) {
		var source;
		var prop;
		for ( var i = 1, length = arguments.length; i < length; i++ ) {
			source = arguments[i];
			for ( prop in source ) {
				obj[prop] = source[prop];
			}
		}
		return obj;
	}

	/**
	 * Generate data for sending via AJAX call
	 *
	 * @param  {Object} data
	 *
	 * @return {Object}
	 */
	function generate ( data ) {
		var obj;
		obj = extend({},{
			logType: 'Generic',
			userAgent: navigator.userAgent,
			time: (!Date.now ? new Date().getTime() : Date.now())
		}, data);
		return obj;
	}

	/**
	 * Serialize params for sending via AJAX call
	 *
	 * @param  {Object} data
	 *
	 * @return {String}
	 */
	function qs ( data ) {
		var arr = [];
		var encode = encodeURIComponent;
		for (var prop in data) {
			if (data.hasOwnProperty(prop)) {
				arr.push(encode(prop) + '=' + encode(data[prop]));
			}
		}
		return arr.join('&');
	}

	function interceptConsole () {

		if ( !window.console || consoleIntercepted ) {
			return;
		}
		consoleIntercepted = true;

		var methods = ['log', 'warn', 'error'];

		function intercept ( method ) {

			var original = window.console[method];

			window.console[method] = function BeaconConsoleCall ( content ) {

				// Do sneaky stuff
				for ( var i = 0, queueLength = queue['console'].length; i < queueLength; i++ ) {
					sendConsole.call(queue['console'][i], method, content);
				}

				if ( original.apply ) {
					// Do this for normal browsers
					original.apply(window.console, arguments);
				} else {
					// Do this for IE
					original(Array.prototype.slice.apply(arguments).join(' '));
				}

			};

		}

		for ( var i = 0; i < methods.length; i++ ) {
			intercept(methods[i]);
		}

	}

	/**
	 * Catch JS errors
	 *
	 * @param  {String} errorMessage
	 * @param  {String} url
	 * @param  {Integer} lineNumber
	 *
	 * @return {}
	 */
	function BeaconErrorJS ( errorMessage, url, lineNumber ) {
		if ( originalErrorJS ) {
			originalErrorJS.apply(window, arguments);
		}
		for ( var i = 0, queueLength = queue.js.length; i < queueLength; i++ ) {
			sendJS.apply(queue.js[i], arguments);
		}
		return false;
	}
	var originalErrorJS = window.onerror;
	window.onerror = BeaconErrorJS;

	/**
	 * Catch JS error
	 *
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
	 * Catch console call
	 *
	 * @param  {String} method
	 * @param  {String} message
	 *
	 * @return {Object}
	 */
	function sendConsole ( method, message ) {

		return this.send(generate({
			logType: 'Console call',
			methodType: method,
			url: window.location.href,
			message: message
		}));

	}

	/**
	 * @class
	 *
	 * @param {Object} options
	 */
	function Beacon ( options ) {

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

		events.setup.call(this, type);

		if ( this.options['console'] ) {
			interceptConsole();
		}

	}

	/**
	 * Send call via AJAX method
	 *
	 * @param  {Object} data
	 *
	 * @return {Object}
	 */
	Beacon.prototype.send = function ( data ) {

		data = generate(data);

		// var xhr = new XMLHttpRequest();
		// xhr.open('GET', this.options.url + '?' + qs(data), true);
		// xhr.send();

		(new Image()).src = this.options.url + '?' + qs(data);

		return data;

	};

	Beacon.prototype.destroy = function () {
		events.destroy.call(this);
	};

	/**
	 * @type {Object}
	 */
	Beacon.prototype.defaults = {
		url: '',
		js: true,
		'console': false
	};

	window.kist = window.kist || {};
	window.kist.Beacon = Beacon;

})( window, document );
