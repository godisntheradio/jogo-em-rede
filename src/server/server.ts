import * as express from 'express';
import * as http from 'http';
import * as io from 'socket.io';
let app = express();
let server = new http.Server(app);
let ioServer = io(server);

app.use((req,res,next) => {
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

class Point
{
    x : number;
    y : number;

    constructor(x : number, y : number)
    {
        this.x = x;
        this.y = y;
    }

    magnitude() : number
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalized() : Point
    {
        let mag = this.magnitude();
        return new Point(this.x / mag, this.y / mag);
    }

    add(other : Point) : Point
    {
        return new Point(this.x + other.x, this.y + other.y);
    }

    sub(other : Point) : Point
    {
        return new Point(this.x - other.x, this.y - other.y);
    }

    mult(factor : number) : Point
    {
        return new Point(this.x * factor, this.y * factor);
    }
}

class Player {
    pos : Point;
    bullets : Bullet[] = [];
    public name : string = "";

    readonly radius : number = 32;

    constructor(name : string, posOrX : Point | number, y? : number)
    {
        if(typeof posOrX == 'number')
        {
            this.pos = new Point(posOrX, y);
        }
        else
        {
            this.pos = posOrX;
        }
        this.name = name;
    }
}

class Bullet {
    pos : Point;
    dir : Point;

    id : number;

    static nextId : number = 0;

    readonly radius : number = 8;

    private startPos : Point;
    public get StartPos() { return this.startPos };

    speed : number = 200;
    range : number = 300;
    damage : number = 10;

    ownerId : number;

    constructor(pos, dir, speed? : number, range? : number, damage? : number)
    {
        this.pos = new Point(pos.x, pos.y);
        this.startPos = pos;
        this.dir = dir;
        if(range) this.range = range;
        if(damage) this.damage = damage;
        if(speed) this.speed = speed;

        this.id = Bullet.nextId++;
    }
}

class Client 
{
    public socket : io.Socket;
    public id : number;
    public player : Player = null;
    static nextId : number = 0;

    constructor(socket : io.Socket)
    {
        this.socket = socket;
        this.id = Client.nextId++;
    }
}

let clients : Client[] = [];

function allOthers(id : number, callback : Function)
{
    for(let i = 0; i < clients.length; ++i)
    {
        if(id != clients[i].id)
        {
            callback(clients[i]);
        }
    }
}

function testCollision(bullet : Bullet) : boolean
{
    for(let i = 0; i < clients.length; ++i)
    {
        let c = clients[i];
        if(c.player != null)
        {
            if(bullet.ownerId != c.id && bullet.pos.sub(c.player.pos).magnitude() < c.player.radius + bullet.radius)
            {
                let hitPos = bullet.pos.add(c.player.pos.sub(bullet.pos).normalized().mult(bullet.radius));
                c.socket.emit('player-hit', { damage: bullet.damage, pos: hitPos, bRemoteId: bullet.id, bulletOwner: bullet.ownerId });
                allOthers(c.id, (cc : Client) => {
                    cc.socket.emit('enemy-hit', { bRemoteId: bullet.id, pos: hitPos })
                });
                return true;
            }
        }        
    };
    return false;
}


let deltaTime = 1/60;
function Update() : void
{
    clients.forEach(c => {
        if(c.player != null)
        {
            for(let i = 0; i < c.player.bullets.length; ++i)
            {
                let b = c.player.bullets[i];
                
                if(testCollision(b))
                {
                    delete c.player.bullets[i];
                    c.player.bullets.splice(i, 1);
                    break;
                }

                b.pos.x += b.dir.x * b.speed * deltaTime;
                b.pos.y += b.dir.y * b.speed * deltaTime;

                if(b.pos.sub(b.StartPos).magnitude() > b.range)
                {
                    delete c.player.bullets[i];
                    c.player.bullets.splice(i, 1);
                    --i;
                }
            }
        }
    });
}

let updateInterval = setInterval(() => { Update() }, deltaTime * 1000);

app.get('/', function (req, res) {
    res.send("hsioahdfionhajodf");
});
ioServer.on('connection', socket => {
    let client = new Client(socket);
    clients.push(client);

    console.log("user connected, id: " + client.id);

    socket.on('player-connected', data => {
        data.id = client.id;
        client.player = new Player(data.name,data.pos.x, data.pos.y);
        console.log('total clients: ' + clients.length);

        allOthers(client.id, (c : Client) => {
            c.socket.emit('enemy-connected', data);
            if (c.player != null) {
                socket.emit('enemy-connected', { pos: c.player.pos, id: c.id, name : c.player.name })
            }
        });
    });
    socket.on('player-move', data => {
        data.id = client.id;
        if(client.player != null)
            client.player.pos = new Point(data.pos.x, data.pos.y);
        allOthers(client.id, (c : Client) => {
            c.socket.emit('enemy-move', data);
        });
    });

    socket.on('player-shoot', data => {
        data.id = client.id;
        let b = new Bullet(data.pos, data.dir, data.speed, data.range, data.damage);
        b.ownerId = client.id;
        client.player.bullets.push(b);

        socket.emit('bullet-id-assign', { bLocalId: data.bLocalId, bRemoteId: b.id });
        data.bRemoteId = b.id;

        allOthers(client.id, (c : Client) => {
            c.socket.emit('enemy-shoot', data);
        });
    });

    socket.on('pinga', data => {
        socket.emit('pingback', data);
    });
    socket.on('disconnect', ()=>
    {
        console.log('user disconnected, id: ' + client.id);
        ioServer.emit('enemy-disconnected', { id: client.id });
        for(let i = 0; i < clients.length; ++i)
        {
            if(clients[i].id == client.id)
            {
                delete clients[i];
                clients.splice(i, 1);
            }
        }
    });

    socket.on('player-dead', data => {
        data.id = client.id;
        for(let c  of clients)
        {
            if(c.id == data.bulletOwner)
            {
                c.socket.emit('player-scored', null);
                break;
            }
        };
        allOthers(client.id, (c : Client) => {
            c.socket.emit('enemy-dead', data);
        });
    });
});
let port = 50458;

server.listen(port, '0.0.0.0', function () {
    console.log("listening... " + port);
});

