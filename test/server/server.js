var express = require('express');
var path = require('path');
var empty = require('is-empty');

var app = express();
var data = {
	'log': [],
	'log1': []
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.get('/log', function(req, res){
	if ( !empty(req.query) ) {
		data.log.push(req.query);
	}
	res.render('index', { title: 'Standard log', data: data.log });
});

app.get('/log1', function(req, res){
	if ( !empty(req.query) ) {
		data.log1.push(req.query);
	}
	res.render('index', { title: 'Alternative log', data: data.log1 });
});

app.listen(3000);
