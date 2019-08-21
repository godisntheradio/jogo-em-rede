import { GameProvider } from "../providers/game/game";
import { Particle } from "phaser-ce";

export class Bullet extends Phaser.Sprite
{
    dir : Phaser.Point;
    speed : number;

    range : number = 300;

    originalPosition : Phaser.Point;

    dmg : number = 10;

    ownerId : number = -1;

    playerBullet : boolean = false;

    private static nextLocalId : number = 0;
    
    private localId : number = -1;
    public remoteId : number = -1;
    public get LocalId() { return this.localId; }

    private static bullets : Bullet[] = []

    public static bIdAssign(data) : void
    {
        for(let i = 0; i < this.bullets.length; ++i)
        {
            if(this.bullets[i].localId == data.bLocalId)
            {
                this.bullets[i].remoteId = data.bRemoteId;
                break;
            }
        }
    }

    public static Destroy(remoteId : number, hit : boolean = true)
    {
        for(let i = 0; i < this.bullets.length; ++i)
        {
            if(this.bullets[i].remoteId == remoteId)
            {
                if(hit)
                    this.bullets[i].onDestroy();
                this.bullets[i].destroy(true);
                this.bullets.splice(i, 1);
                break;
            }
        }
    }
    public static checkCollision(pos : Phaser.Point, radius : number, enemyId : number = -1) : number[]
    {
        let hits : number[] = [];
        for(let i = 0; i < this.bullets.length; ++i)
        {
            let b = this.bullets[i];
            if(enemyId != b.ownerId && pos.subtract(b.x, b.y).getMagnitude() < (b.width/2 + radius))
            {
                hits.push(b.remoteId);
            }
        }

        return hits;
    }

    constructor(game: Phaser.Game, x: number, y: number, img: string)
    {
        super(game, x, y, img);
        this.localId = Bullet.nextLocalId++;

        this.originalPosition = new Phaser.Point(x, y);
        
        game.physics.arcade.enable(this);
        game.add.existing(this);
        this.anchor.setTo(0.5);

        Bullet.bullets.push(this);

        
        Phaser.Point.prototype.subtract = function(x : number, y : number)
        {
            return new Phaser.Point(this.x - x, this.y - y);
        }
        Phaser.Point.prototype.add = function(x : number, y : number)
        {
            return new Phaser.Point(this.x + x, this.y + y);
        }
        Phaser.Point.prototype.multiply = function(f : number)
        {
            return new Phaser.Point(this.x * f, this.y * f);
        } 
        Phaser.Point.prototype.normalize = function()
        {
            let mag = this.getMagnitude();
            return new Phaser.Point(this.x / mag, this.y / mag);
        }
    }

    init(dir: Phaser.Point, speed: number, range? : number, damage? : number) : void
    {
        this.speed = speed;
        this.dir = dir;
        if(range) this.range = range;
        if(damage) this.dmg = damage;
    }

    onDestroy() : void
    {
        let emitter = this.game.add.emitter(this.x, this.y, 25);
        emitter.makeParticles('red');

        emitter.maxParticleScale = 0.05;
        emitter.minParticleScale = 0.05;
        
        emitter.update = function()
        {
            emitter.forEachAlive(function(p : Particle) {
                p.alpha = p.lifespan / emitter.lifespan;
                let b : Phaser.Physics.Arcade.Body = (p.body as Phaser.Physics.Arcade.Body);
                b.velocity = b.velocity.multiply(1.11, 1.11);
            });
        }

        emitter.start(true, 500, null, 25);
    }

    update() : void 
    {
        //(this.body as Phaser.Physics.Arcade.Body).velocity = this.dir.normalize().multiply(this.speed, this.speed);
        let mv = this.dir.normalize().multiply(this.speed * (this.game.time.elapsed / 1000), this.speed * (this.game.time.elapsed / 1000));
        this.position = this.position.add(mv.x, mv.y);
        if(Phaser.Point.subtract(this.position, this.originalPosition).getMagnitude() > this.range)
        {
            Bullet.Destroy(this.remoteId, false);
        }
    }
}