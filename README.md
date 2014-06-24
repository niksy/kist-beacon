# kist-beacon

Front-end logging interface.

## Installation

```sh
bower install niksy/kist-beacon
```

## API

### `new Beacon(options)`

Returns: `Object`

#### Options

##### url

Type: `String`  
Default: ` `  
*Required*

Endpoint where your application will pass query parameters from AJAX call and do with them what you desire: save them to database, logfile on server, etc.

##### js

Type: `Boolean`  
Default: `true`

Log JS errors.

##### console

Type: `Boolean`  
Default: `false`

Log console calls (`log`, `warn`, `error`).

### `send(data)`

Returns: `Object`

Sends information to provided URL. Information will be send as standard `GET` request. Parsing should be done by back-end application.

#### data

Type: `Object`  
*Required*

### `destroy`

Destroys logger instance.

## Examples

Create new instance.

```js
var beacon = new kist.Beacon({
	url: '/log',
	js: true,
	console: false
});
```

Message examples.

```json
{
	"logType":"JS Error",
	"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",
	"time":1403629312238,
	"errorMessage":"Uncaught ReferenceError: barfoo is not defined",
	"url":"http://example.com/",
	"lineNumber":12
}

{
	"logType":"Console call",
	"userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36",
	"time":1403629312238,
	"methodType":"log",
	"url":"http://example.com/",
	"message":"console call"
} 
```

Destroy instance.

```js
beacon.destroy();
```

## Browser support

Tested in IE8+ and all modern browsers.

## Acknowledgments

* https://github.com/Lapple/ErrorBoard
* http://tobyho.com/2012/07/27/taking-over-console-log/
* http://stackoverflow.com/questions/8087240/if-i-override-window-onerror-in-javascript-should-i-return-true-or-false

## License

MIT © [Ivan Nikolić](http://ivannikolic.com)
