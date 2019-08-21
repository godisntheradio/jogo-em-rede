import "pixi";
import "p2";
import * as Phaser from 'phaser-ce';
import { Weapon } from "./weapon";
import { GameProvider } from "../providers/game/game";
import { SocketIoProvider } from "../providers/socket-io/socket-io";
import { Bullet } from "./bullet";
import { HomePage } from "../pages/home/home";

export class Player extends Phaser.Sprite
{       
    weapon : Weapon = new Weapon('bullet');

    public firing : boolean = false;

    speed : number;

    lastDir : Phaser.Point = new Phaser.Point(0, 0);

    health : number = 100;

    lastMoved : boolean = false;

    name : string = "";

    displayName : Phaser.Text = null;

    healthBar : Phaser.Sprite = null;

    score : number = 0;

    dead : boolean = false;

    constructor(game : Phaser.Game, pos : Phaser.Point, sprite : string)
    {
        super(game, pos.x, pos.y, sprite);

        this.speed = 3.3;

        game.add.existing(this);

        this.healthBar = this.game.add.sprite(this.game.camera.width / 2, 0, 'healthBar');
        this.healthBar.position.y = this.healthBar.height/2;
        this.healthBar.scale = new Phaser.Point(1, 0.5);
        this.healthBar.tint = 0x00ff00;
        this.healthBar.fixedToCamera = true;
        this.healthBar.anchor.setTo(0.5, 0.5);
    }

    update() : void
    {
        this.weapon.update();

        if (this.displayName != null) 
        {
            this.displayName.x = this.x;
            this.displayName.y = this.y - 45;
        }

        let hits : number[] = Bullet.checkCollision(this.position, this.width/2);
        for(let i of hits)
        {
            Bullet.Destroy(i);
        }

        if(this.healthBar)
        {
            this.healthBar.scale.x = this.health / 100;
            this.healthBar.tint = this.health > 66 ? 0x00ff00 : this.health > 33 ? 0xffff00 : 0xff0000
        }
    }
    move(pos)
    {
        if (!this.firing) 
        {
            let vec = new Phaser.Point(pos.x - this.x, pos.y - this.y);
            vec = vec.normalize();
            this.x += vec.x * this.speed;
            this.y += vec.y * this.speed;
            
            let temp = new Phaser.Point(vec.x - this.lastDir.x, vec.y - this.lastDir.y);
            if(temp.x > 0.01 || temp.x < -0.01 || temp.y > 0.01 || temp.y < -0.01)
            {
                GameProvider.Instance.socketProvider.emit('player-move', { pos: this.position, dir: vec, speed: this.weapon.speed, range: this.weapon.range });
                this.lastDir = vec;
            }
        }
        else
        {
            this.shoot(new Phaser.Point(pos.x - this.x, pos.y - this.y).normalize());
        }
    }
    stop() : void
    {
        GameProvider.Instance.socketProvider.emit('player-move', { pos: this.position, dir: new Phaser.Point(0, 0) });
    }
    shoot(dir : Phaser.Point) : void
    {
        let b = this.weapon.shoot(this.position, dir);
        if(b != null)
            b.playerBullet = true;
    }

    hit(damage : number) : { dead : boolean }
    {
        this.health -= damage;
        return { dead: this.health <= 0 };
    }

    die(bulletId : number) : void
    {
        if(this.dead)
            return;
        this.dead = true;
        GameProvider.Instance.socketProvider.emit('player-dead', { pos: this.position, bulletOwner: bulletId });
        
        let emitter = this.game.add.emitter(this.x, this.y, 10);
        emitter.makeParticles('red');

        emitter.maxParticleScale = 0.33;
        emitter.minParticleScale = 0.25;
        emitter.update = function()
        {
            emitter.forEachAlive(function(p : Phaser.Particle) {
                p.alpha = p.lifespan / emitter.lifespan;
                let b : Phaser.Physics.Arcade.Body = (p.body as Phaser.Physics.Arcade.Body);
                //b.velocity = b.velocity.multiply(1.11, 1.11);
            });
        }

        emitter.start(true, 500, null, 20);
        if(this.score != 0)
        {
            GameProvider.Instance.dbProvider.postScore(this.name, this.score);
        }
        GameProvider.Instance.changeToLeaderboards();
    }
    
    respawn()
    {
        console.log("loco");
        this.displayName.destroy(true);
        this.healthBar.destroy(true);
        this.destroy(true);
    }

    setName(name)
    {
        this.name = name;
        let style = { font : "18px Arial", fill:"#ffffff",wordWrap: true, wordWrapWidth: this.texture.width, align: "center"}
        this.displayName = this.game.add.text(0,0,"["+name+"]",style);
        this.displayName.anchor.set(0.5);
    }
    connectToServer()
    {
        GameProvider.Instance.socketProvider.emit('player-connected', { pos: this.position , name : this.name});
    }
}