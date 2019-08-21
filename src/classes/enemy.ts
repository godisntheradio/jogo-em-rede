import { Weapon } from './weapon';
import { Bullet } from './bullet';

export class Enemy extends Phaser.Sprite
{
    weapon : Weapon = new Weapon('bullet');

    name : string = "";

    public displayName : Phaser.Text = null;

    speed : number;

    public moveDir : Phaser.Point = new Phaser.Point(0, 0);

    private id : number;
    public get Id() { return this.id; }

    constructor(game : Phaser.Game, pos : Phaser.Point, sprite : string, id : number)
    {
        super(game, pos.x, pos.y, sprite);
        
        this.id = id;
        this.weapon.fireRate = 100;

        this.speed = 3.3;
        this.anchor.setTo(0.5);
        game.add.existing(this);
    }


    update() : void
    {
        let vec = this.moveDir.normalize();
        this.x += vec.x * this.speed;
        this.y += vec.y * this.speed;
        
        this.weapon.update();

        if (this.displayName != null) 
        {
            this.displayName.x = this.x;
            this.displayName.y = this.y - 45;
        }

        let hits = Bullet.checkCollision(this.position, this.width/2, this.id);
        for (let i of hits)
        {
            Bullet.Destroy(i);
        }
    }

    shoot(dir : Phaser.Point) : void
    {
        this.weapon.shoot(this.position, dir);
    }
    setName(name)
    {
        this.name = name;
        let style = { font : "18px Arial", fill:"#ffffff",wordWrap: true, wordWrapWidth: this.texture.width, align: "center"}
        this.displayName = this.game.add.text(0,0,"["+name+"]",style);
        this.displayName.anchor.set(0.5);
    }

    die()
    {
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
    }
}