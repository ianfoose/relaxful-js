// modules
var WebSocketServer = require('websocket').server;

// server object
var serverObj = {};

//connections array
var connections = [];
var validTopics = []; // optional
var routes = [];

module.exports.route = function(name, func) {
	if(!func) {
    	throw new Error('empty route function');
    } else {
    	if(!name) {
        	throw new Error('empty route name');
        } else {
        	if(routes.findIndex(x => x.name === name) < 0) {
        		routes.push({route: name, func: func});
        	}
        }
    }
};

module.exports.createSocketServer = function(options) {
    var port = 80;
    var protocol = 'echo-protocol';

    if(options) {
        if(options.validTopics) {
            if(options.validTopics instanceof Array) {
                validTopics = options.validTopics;
            } else {
                throw new Error('Invalid Format, invalid topics must be array');
            }
        }

        if(options.port) {
            if(!isNaN(port)) {
                port = options.port;
            }
        }

        if(options.protocol) {
            protocol = options.protocol.trim();
        }

        if(options.ssl) { // https
            var sslOptions = options.ssl;

            if(sslOptions.key && sslOptions.cert) {
                var https = require('https');
                serverObj.server = https.createServer(sslOptions, function(request, response) {
                   showStartMessage(request, response);
                });
            } else {
                throw new Error('No SSL Credentials Provided');
            }
        } else { // http
            var http = require('http');
            serverObj.server = http.createServer(function(request, response) {
                showStartMessage(request, response);
            });
        }
    }

    serverObj.server.listen(port, function() {
        console.log((new Date()) + ' Server is listening on port '+port);
    });

    serverObj.wsServer = new WebSocketServer({
        httpServer: serverObj.server,

        // check socket origin
        autoAcceptConnections: false
    });

    serverObj.wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
          // Make sure we only accept requests from an allowed origin 
          
          request.reject();
          console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
          return;
        }
        var connection = request.accept(protocol, request.origin); 

        //store the new connection in your array of connections
        connection.subscriptions = [];
        connections.push(connection);

        console.log((new Date()) + ' Connection accepted.');

        connection.on('message', function(message) {
            if (message.type === 'utf8') { // utf8
                setConnectionDataType(connection,'utf8'); 
                parseBody(message.utf8Data, connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)]);
            } else if (message.type === 'binary') { // binary
                setConnectionDataType(connection,'binary');
                parseBody(toUTF8(message.binaryData.toString()), this.connections[this.connections.findIndex(x => x.remoteAddress === connection.remoteAddress)]);
            }
        });

        connection.on('close', function(reasonCode, description) {
            connections.splice(connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)], 1);
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });

    return serverObj;
};

// sends to all connected sockets
module.exports.sendToAll = function(message) {
    for(var i=0;i<connections.length;i++) {
        sendData(message, connections[i]);
    }
};

// sends data to all topics and subscribing ids
module.exports.sendToTopic = function(topic,message,ids) {
    for(var i=0;i<connections.length;i++) {
        if(connections[i].subscriptions.findIndex(x => x.topic === topic) >= 0) {
            var con = connections[i].subscriptions[connections[i].subscriptions.findIndex(x => x.topic === topic)];

            if(ids) {
                if(con.ids) {
                    ids = getIDArray(ids);

                    for(var c=0;c<ids.length;c++) {
                        for(var tID=0;tID<con.ids.length;tID++) {
                            if(con.ids[tID] === ids[c]) {
                                sendData(message, connections[i]);
                            }
                        }
                    }
                }
            } else { // send to topic
               sendData(message, connections[i]);
            }
        }
    } 
};

// ====== helper functions ======

function setConnectionDataType(connection, type) {
    if(connections.findIndex(x => x.remoteAddress === connection.remoteAddress) >= 0) {
        connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)].message_type = 'utf8';
    }
}

function getConnectionDataType(connection) {
    if(connections.findIndex(x => x.remoteAddress === connection.remoteAddress) >= 0) {
        var cConnection = connections.findIndex(x => x.remoteAddress === connection.remoteAddress);
        if(cConnection.message_type) {
            return cConnection.message_type;
        }
    }
    return 'utf8';
}

function showStartMessage(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
}

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

// sends data to connection as binary or utf8
function sendData(message, connection) {
    type = getConnectionDataType(connection);

    if(type == 'binary') {
        let buf = new Buffer(message);
        connection.sendBytes(buf);
    } else {
        connection.sendUTF(message);
    }
}

// checks if data os json
function isJSON(data) {
    try {
        JSON.parse(data);
        return true;
    } catch(e) {
        return false;
    }
}

// gets id array or makes singular id into an array
function getIDArray(data) {
    if(!(data instanceof Array)) {
        data = [data];  
    } 
    return data;
}

// manages custom commands 'routes'
function router(message, connection) {
    var command = message.command;

	if(command) {
        var i = routes.findIndex(x => x.route === command);
      
		if(i >= 0) {
			routes[i].func(message, connection);
		}
	} else { // no command
        sendData('No Command',connection);
	}
}

// parses message body
function parseBody(message, connection) {
    if(message) {
        if(isJSON(message)) {
            message = JSON.parse(message);

            if(message.command) {
                var command = message.command;

                if(command == 'subscribe' || command == 'unsubscribe') {
                    if(message.data) {
                        var data = message.data;
                        var idIndex = connection.subscriptions.findIndex(x => x.topic === data.topic);

                        if(data.topic) {
                            if(command == "subscribe") {
                                if(validTopics.length > 0) {
                                    for(var i=0;i<validTopics.length;i++) {
                                        if(data.topic == validTopics[i]) {
                                            if(idIndex < 0) {
                                                var t = {topic:data.topic,ids:[]};
                                                connection.subscriptions.push(t);
                                                break;
                                            } else {
                                                break;
                                            }
                                        } else {
                                            if(i == validTopics.length - 1) {
                                                sendData("Invalid Topic", connection);
                                                return;
                                            }
                                        }
                                    }
                                } else {
                                    if(idIndex < 0) {
                                        var t = {topic:data.topic,ids:[]};
                                        connection.subscriptions.push(t);
                                    }
                                }
                            } else {
                                if(!data.id) {
                                    if(idIndex >= 0) {
                                        connection.subscriptions.splice(idIndex,1);
                                    }
                                }
                            }
                        }

                        if(data.id) {
                            data.id = getIDArray(data.id);
                            idIndex = connection.subscriptions.findIndex(x => x.topic === data.topic);

                            for(var i=0;i<data.id.length;i++) {                               
                                if(command == 'subscribe') {
                                    if(connection.subscriptions[idIndex].ids.indexOf(data.id[i]) < 0) {
                                        connection.subscriptions[idIndex].ids.push(data.id[i]);
                                    } 
                                } else {
                                    if(connection.subscriptions[idIndex].ids.indexOf(data.id[i]) >= 0) {
                                        connection.subscriptions[idIndex].ids.splice(connection.subscriptions[idIndex].ids.indexOf(data.id[i]),1);
                                    }
                                }
                            }
                        }

                        connections[connections.findIndex(x => x.remoteAddress === connection.remoteAddress)] = connection;
                    } else {
                        console.log('Received NO Data: ' + message);  
                    }
                } else {
                    router(message, connection);
                } 
            } else { // abort
                sendData("NO Command Recieved", connection);
            }       
        } else { // default
            console.log('Received Message: ' + message);
        }
    } 
}
