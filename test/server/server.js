var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var path = require('path');
var empty = require('is-empty');

var app = express();
var data = {
	'log': [],
	'log1': []
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.post('/log', function(req, res){
	if ( !empty(req.body) ) {
		data.log.push(req.body);
	}
	res.end();
});
app.get('/log', function(req, res){
	res.render('index', { title: 'Standard log', data: data.log });
});

app.post('/log1', function(req, res){
	if ( !empty(req.body) ) {
		data.log1.push(req.body);
	}
	res.end();
});
app.get('/log1', function(req, res){
	res.render('index', { title: 'Standard log', data: data.log1 });
});

app.listen(3000);
