"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var http = require("http");
var io = require("socket.io");
var app = express();
var server = new http.Server(app);
var ioServer = io(server);
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Point.prototype.normalized = function () {
        var mag = this.magnitude();
        return new Point(this.x / mag, this.y / mag);
    };
    Point.prototype.add = function (other) {
        return new Point(this.x + other.x, this.y + other.y);
    };
    Point.prototype.sub = function (other) {
        return new Point(this.x - other.x, this.y - other.y);
    };
    Point.prototype.mult = function (factor) {
        return new Point(this.x * factor, this.y * factor);
    };
    return Point;
}());
var Player = /** @class */ (function () {
    function Player(name, posOrX, y) {
        this.bullets = [];
        this.name = "";
        this.radius = 32;
        if (typeof posOrX == 'number') {
            this.pos = new Point(posOrX, y);
        }
        else {
            this.pos = posOrX;
        }
        this.name = name;
    }
    return Player;
}());
var Bullet = /** @class */ (function () {
    function Bullet(pos, dir, speed, range, damage) {
        this.radius = 8;
        this.speed = 200;
        this.range = 300;
        this.damage = 10;
        this.pos = new Point(pos.x, pos.y);
        this.startPos = pos;
        this.dir = dir;
        if (range)
            this.range = range;
        if (damage)
            this.damage = damage;
        if (speed)
            this.speed = speed;
        this.id = Bullet.nextId++;
    }
    Object.defineProperty(Bullet.prototype, "StartPos", {
        get: function () { return this.startPos; },
        enumerable: true,
        configurable: true
    });
    ;
    Bullet.nextId = 0;
    return Bullet;
}());
var Client = /** @class */ (function () {
    function Client(socket) {
        this.player = null;
        this.socket = socket;
        this.id = Client.nextId++;
    }
    Client.nextId = 0;
    return Client;
}());
var clients = [];
function allOthers(id, callback) {
    for (var i = 0; i < clients.length; ++i) {
        if (id != clients[i].id) {
            callback(clients[i]);
        }
    }
}
function testCollision(bullet) {
    var _loop_1 = function (i) {
        var c = clients[i];
        if (c.player != null) {
            if (bullet.ownerId != c.id && bullet.pos.sub(c.player.pos).magnitude() < c.player.radius + bullet.radius) {
                var hitPos_1 = bullet.pos.add(c.player.pos.sub(bullet.pos).normalized().mult(bullet.radius));
                c.socket.emit('player-hit', { damage: bullet.damage, pos: hitPos_1, bRemoteId: bullet.id, bulletOwner: bullet.ownerId });
                allOthers(c.id, function (cc) {
                    cc.socket.emit('enemy-hit', { bRemoteId: bullet.id, pos: hitPos_1 });
                });
                return { value: true };
            }
        }
    };
    for (var i = 0; i < clients.length; ++i) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    ;
    return false;
}
var deltaTime = 1 / 60;
function Update() {
    clients.forEach(function (c) {
        if (c.player != null) {
            for (var i = 0; i < c.player.bullets.length; ++i) {
                var b = c.player.bullets[i];
                if (testCollision(b)) {
                    delete c.player.bullets[i];
                    c.player.bullets.splice(i, 1);
                    break;
                }
                b.pos.x += b.dir.x * b.speed * deltaTime;
                b.pos.y += b.dir.y * b.speed * deltaTime;
                if (b.pos.sub(b.StartPos).magnitude() > b.range) {
                    delete c.player.bullets[i];
                    c.player.bullets.splice(i, 1);
                    --i;
                }
            }
        }
    });
}
var updateInterval = setInterval(function () { Update(); }, deltaTime * 1000);
app.get('/', function (req, res) {
    res.send("hsioahdfionhajodf");
});
ioServer.on('connection', function (socket) {
    var client = new Client(socket);
    clients.push(client);
    console.log("user connected, id: " + client.id);
    socket.on('player-connected', function (data) {
        data.id = client.id;
        client.player = new Player(data.name, data.pos.x, data.pos.y);
        console.log('total clients: ' + clients.length);
        allOthers(client.id, function (c) {
            c.socket.emit('enemy-connected', data);
            if (c.player != null) {
                socket.emit('enemy-connected', { pos: c.player.pos, id: c.id, name: c.player.name });
            }
        });
    });
    socket.on('player-move', function (data) {
        data.id = client.id;
        if (client.player != null)
            client.player.pos = new Point(data.pos.x, data.pos.y);
        allOthers(client.id, function (c) {
            c.socket.emit('enemy-move', data);
        });
    });
    socket.on('player-shoot', function (data) {
        data.id = client.id;
        var b = new Bullet(data.pos, data.dir, data.speed, data.range, data.damage);
        b.ownerId = client.id;
        client.player.bullets.push(b);
        socket.emit('bullet-id-assign', { bLocalId: data.bLocalId, bRemoteId: b.id });
        data.bRemoteId = b.id;
        allOthers(client.id, function (c) {
            c.socket.emit('enemy-shoot', data);
        });
    });
    socket.on('pinga', function (data) {
        socket.emit('pingback', data);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected, id: ' + client.id);
        ioServer.emit('enemy-disconnected', { id: client.id });
        for (var i = 0; i < clients.length; ++i) {
            if (clients[i].id == client.id) {
                delete clients[i];
                clients.splice(i, 1);
            }
        }
    });
    socket.on('player-dead', function (data) {
        data.id = client.id;
        for (var _i = 0, clients_1 = clients; _i < clients_1.length; _i++) {
            var c = clients_1[_i];
            if (c.id == data.bulletOwner) {
                c.socket.emit('player-scored', null);
                break;
            }
        }
        ;
        allOthers(client.id, function (c) {
            c.socket.emit('enemy-dead', data);
        });
    });
});
var port = 50458;
server.listen(port, '0.0.0.0', function () {
    console.log("listening... " + port);
});
