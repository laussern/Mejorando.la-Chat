//Importamos fs, cluster y ./config
var fs = require('fs'),
	cluster = require('cluster'),
	config = require('./config');
//Permite crear una red de procesos compartidos con todos los servidores
if(cluster.isMaster) {
	for(var i = 0; i < require('os').cpus().length; i++) {
		cluster.fork();
	}

	cluster.on('exit', function (worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
		cluster.fork();
		console.log('worker restarted');
	});
} else {
	//Agarran la aplicacion y la guardan junto a la configuracion
	//Agarran la informacion de la sesion y la guardan en sessionStore
	var app = require('./app')(config),
		sessionStore = app.sessionStore;
	//Tomamos la app
	app = app.app;

	/*
	* Configuracion del server
	*/
	var server = config.secure ? require('https').createServer({key: fs.readFileSync(config.key).toString(),
      cert: fs.readFileSync(config.cert).toString()}, app) : require('http').createServer(app);

	// Importamos io con las funciones que necesitamos
	require('./io')(config, server, sessionStore);

	/*
	* Puerto de escucha
	*/
	server.listen(config.port, function(){
		console.log("Mejorando.la Chat server listening on port ");
	});
}
