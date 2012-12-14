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
	// aplication
	var app = require('./app')(config),
		sessionStore = app.sessionStore;

	app = app.app;

	/*
	* Server configuration
	*/
	var server = config.secure ? require('https').createServer({key: fs.readFileSync(config.key).toString(),
      cert: fs.readFileSync(config.cert).toString()}, app) : require('http').createServer(app);

	// io
	require('./io')(config, server, sessionStore);

	/*
	* Bootstrap
	*/
	server.listen(config.port, function(){
		console.log("Mejorando.la Chat server listening on port ");
	});
}
