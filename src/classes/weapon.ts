import { GameProvider } from "../providers/game/game";
import { Bullet } from "./bullet";


export class Weapon
{
    bulletImg : string;
    speed : number = 200;
    range : number = 300;
    damage : number = 10;

    public fireRate : number = 5;

    timer : number = 0;

    canShoot : boolean = true;

    constructor(bulletImg : string)
    {
        this.bulletImg = bulletImg;
    }

    shoot(pos : Phaser.Point, dir : Phaser.Point) : Bullet
    {
        if(this.canShoot)
        {
            let bullet : Bullet = new Bullet(GameProvider.Instance.game, pos.x, pos.y, this.bulletImg);
            bullet.init(dir, this.speed, this.range, this.damage);
            GameProvider.Instance.socketProvider.emit('player-shoot', { pos: pos, dir: dir, speed: this.speed, range: this.range, damage: this.damage, bLocalId: bullet.LocalId });

            this.canShoot = false;

            return bullet;
        }
        else
            return null;
    }

    update() : void
    {
        if(!this.canShoot)
        {
            this.timer += GameProvider.Instance.game.time.elapsed / 1000;
            if(this.timer >= 1 / this.fireRate)
            {
                this.canShoot = true;
                this.timer -= 1 / this.fireRate
            }
        }
    }
}