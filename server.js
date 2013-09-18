var express = require('express'),
	http = require('http'),
	engines = require('consolidate'),
	requirejs = require('requirejs'),
	signaling = require('./main/js/server/signaling');

var app = express();
var server = http.createServer(app);

signaling.init(server);

app.engine('html',engines.mustache);
app.set('views', __dirname + '/main/html');
app.set('view options',{layout:false});
app.use(express.static(__dirname + '/main/html'));
app.use(express.static(__dirname + '/lib'));
app.use(express.static(__dirname + '/main/js'));

var _id = 0;

app.get('/', function(req, res){
	res.redirect('/webrtc?id='+_id++);
});
app.get('/webrtc', function(req, res){
	res.render('main.html');
});

server.listen(4000);
console.log('Server listening on port 4000');
