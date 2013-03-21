//Importamos fs, cluster y ./config
var fs = require('fs'),
	cluster = require('cluster'),
	config = require('./config');
//Permite crear una red de procesos compartidos con todos los servidores
if(cluster.isMaster) {
	require('./models/report');

	var	os = require('os'),
		mongoose = require('mongoose'),
		Report = mongoose.model('Report');	

	mongoose.connect('mongodb://localhost/' + config.db.name );

	var messagesPerMinute = 0,
		socketConnectionLoad = {};

	for(var i = 0; i < require('os').cpus().length; i++) {
		var worker = cluster.fork();

		worker.on('message', function(msg) {
			if(msg.type === 'user connected'){
				socketConnectionLoad[msg.pid] = msg.connectedUsers;
				console.log("Socket load => sockets connected [" + new Date + "]");
				return;
			}

			if(msg.type === 'user disconected'){
				socketConnectionLoad[msg.pid] = msg.connectedUsers;
				console.log("Socket load => socket disconected [" + new Date + "]");
				return;
			}

			if(msg.type === 'broadcast'){
				messagesPerMinute++;
				console.log("Socket load => Message broadcasted [" + new Date + "]");
				return;
			}
		});		
	}

	setInterval(function(){
		var globalLoad = 0,
			logMessage = '',
			cpuLoad = os.loadavg()[0];

		for(var key in socketConnectionLoad){
			globalLoad = globalLoad + socketConnectionLoad[key];
			logMessage = logMessage + 'pid : ' + key + ' load :' + socketConnectionLoad[key] + '; ';
		}

		console.log("Socket load => Sockets: " + globalLoad + " [" + new Date + "]");
		console.log("Socket load => Per process "+ logMessage);
		console.log("Socket load => CPU load "+ cpuLoad);
		console.log("Socket load => Messages Broadcasted Per Minute "+ messagesPerMinute);
		var report = new Report({
		    connectedSockets             : globalLoad,
		    loadPerProcess               : socketConnectionLoad,
		    messagesBroadcastedPerMinute : messagesPerMinute,
		    cpuLoad                      : cpuLoad
		});
		report.save();

		messagesPerMinute = 0;
	}, 60000);	

	cluster.on('exit', function (worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
		delete socketConnectionLoad[worker.process.pid];
		var worker = cluster.fork();
		console.log('worker restarted');

		worker.on('message', function(msg) {
			if(msg.type === 'user connected'){
				socketConnectionLoad[msg.pid] = msg.connectedUsers;
				console.log("Socket load => sockets connected [" + new Date + "]");
				return;
			}

			if(msg.type === 'user disconected'){
				socketConnectionLoad[msg.pid] = msg.connectedUsers;
				console.log("Socket load => socket disconected [" + new Date + "]");
				return;
			}

			if(msg.type === 'broadcast'){
				messagesPerMinute++;
				console.log("Socket load => Message broadcasted [" + new Date + "]");
				return;
			}
		});			
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
