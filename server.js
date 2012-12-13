var fs = require('fs'),
	cluster = require('cluster'),
	config = require('./config');


if(cluster.isMaster) {
	for(var i = 0; i < require('os').cpus().length; i++) {
		cluster.fork();
	}

	cluster.on('exit', function (worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
	});
} else {
	/*
	* Server configuration
	*/
	var server = config.secure ? require('https').createServer({key: fs.readFileSync(config.key).toString(),
	      cert: fs.readFileSync(config.cert).toString()}) : require('http').createServer();

	var app = require('./app')(server);

	server.on('request', app);

	/*
	* Bootstrap
	*/
	server.listen(config.port, function(){
		console.log("Mejorando.la Chat server listening on port " + app.get('port'));
	});	
}
