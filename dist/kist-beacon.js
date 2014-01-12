/* kist-beacon 0.1.0 - Front-end logging interface. | Author: Ivan Nikolić, 2014 | License: MIT */
var Kist = Kist || {};

Kist.Beacon = (function () {

	var o = {};
	o.settings = {};

	o.init = function ( pParams ) {

		this.settings.loggerUrl = pParams.loggerUrl;

		this.bindActions();

	};

	/**
	 * Bind action
	 *
	 * @return {Ui}
	 */
	o.bindActions = function () {

		var self = this;

		window.onerror = function ( pErrorMessage, pUrl, pLineNumber ) {
			self.catchJsError( pErrorMessage, pUrl, pLineNumber );
		};

		o.interceptConsole();

	};

	/**
	 * Serialize params for sending via AJAX call
	 *
	 * @param  {Object} pObject
	 *
	 * @return {String}
	 */
	o.serializeParams = function ( pObject ) {

		var arrString = [];
		for(var objectProperty in pObject) {
			if (pObject.hasOwnProperty(objectProperty)) {
				arrString.push(encodeURIComponent(objectProperty) + "=" + encodeURIComponent(pObject[objectProperty]));
			}
		}
		return arrString.join("&");

	};

	/**
	 * Intercept `console` calls
	 *
	 * @return {Ui}
	 */
	o.interceptConsole = function () {

		var self = this;

		if ( !window.console ) {
			return;
		}

		var intercept = function ( pMethod ) {

			var original = window.console[pMethod];

			window.console[pMethod] = function () {

				// Do sneaky stuff
				self.catchConsoleCall( pMethod, arguments[0] );

				if (original.apply) {

					// Do this for normal browsers
					original.apply(window.console, arguments);

				} else {

					// Do this for IE
					var message = Array.prototype.slice.apply(arguments).join(' ');
					original(message);

				}

			};

		};

		var methods = ['log', 'warn', 'error'];

		for (var i = 0; i < methods.length; i++) {
			intercept(methods[i]);
		}

	};

	/**
	 * Send call via image source
	 *
	 * @param  {Object} pParams
	 *
	 * @return {Ui}
	 */
	o.imageCall = function ( pParams ) {

		var imageEl = new Image();

		var paramsObject = pParams;
		paramsObject.userAgent = navigator.userAgent;
		paramsObject.time = this.getTimestamp();

		imageEl.src = this.settings.loggerUrl + '?' + this.serializeParams( pParams );

	};

	/**
	 * Send call via AJAX method
	 *
	 * @param  {Object} pParams
	 *
	 * @return {Ui}
	 */
	o.ajaxCall = function ( pParams ) {

		var xmlHttp = new XMLHttpRequest();

		var paramsObject = pParams;
		paramsObject.userAgent = navigator.userAgent;
		paramsObject.time = (!Date.now ? new Date().getTime() : Date.now());

		xmlHttp.open('GET', this.settings.loggerUrl + '?' + this.serializeParams( pParams ),true);
		xmlHttp.send();

	};

	/**
	 * Catch JS error
	 *
	 * @param  {String} pErrorMessage
	 * @param  {String} pUrl
	 * @param  {String} pLineNumber
	 *
	 * @return {Ui}
	 */
	o.catchJsError = function ( pErrorMessage, pUrl, pLineNumber ) {

		var paramsObject = {
			logType: 'JS Error',
			errorMessage: pErrorMessage,
			url: pUrl,
			lineNumber: pLineNumber
		};

		this.ajaxCall( paramsObject );

	};

	/**
	 * Catch `console` call
	 *
	 * @param  {String} pMethod
	 * @param  {String} pMessage
	 *
	 * @return {Ui}
	 */
	o.catchConsoleCall = function ( pMethod, pMessage ) {

		var paramsObject = {
			logType: 'Console call',
			methodType: pMethod,
			message: pMessage
		};

		this.ajaxCall( paramsObject );

	};

	return o;

})();
