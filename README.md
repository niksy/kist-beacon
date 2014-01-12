# Kist Beacon

Front-end logging interface.

## Usage

Include file from `dist` (minifed or default) folder and call following method,
preferably as soon as possible to catch errors on start.

```javascript
Kist.Beacon.init({
	loggerUrl: 'log.php'
});
```

One object parameter is availbable—`loggerUrl`. This is the endpoint where your
application will pass query parameters from AJAX call and do with them what
you desire: save them to database, logfile on server, etc.

## Installation

Distribution files are in `dist` folder.

### Using [Bower](http://bower.io)?

```bash
bower install niksy/kist-beacon
```
