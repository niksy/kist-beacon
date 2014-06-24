var express = require('express');
var path = require('path');
var empty = require('is-empty');

var app = express();
var data = [];

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.get('/log', function(req, res){
	if ( !empty(req.query) ) {
		data.push(req.query);
	}
	res.render('index', { data: data });
});

app.listen(3000);
