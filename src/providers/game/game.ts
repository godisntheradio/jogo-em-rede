import { Injectable } from '@angular/core';
import { DatabaseProvider } from "../database/database";

import 'pixi';
import 'p2';
import * as Phaser from 'phaser-ce';
import { Platform } from 'ionic-angular';
import { Bullet } from '../../classes/bullet';
import { SocketIoProvider } from '../socket-io/socket-io';
import { Player } from '../../classes/player';
import { Enemy } from '../../classes/enemy';
import { HomePage } from '../../pages/home/home';
import { database } from 'firebase';
/*
  Generated class for the GameProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class GameProvider 
{

  enemies : Enemy[] = [];

  public static Instance : GameProvider;

  private parent : HTMLElement = null;
  public get Parent() : HTMLElement { return this.parent; }
  game : Phaser.Game;

  player : Player = null;
  score : number = 0;


  homePage : HomePage = null;

  public Initialized : boolean = false;

  fireButton : Phaser.Button;

  constructor(platform : Platform, public dbProvider : DatabaseProvider, public socketProvider : SocketIoProvider) 
  {
    GameProvider.Instance = this;
    platform.ready().then(readySrc => {

      console.log('Width: ' + platform.width());
      console.log('Height: ' + platform.height());

      this.parent = document.createElement('div');
      let config : Phaser.IGameConfig = 
      {
        width: platform.width(),
        height: platform.height(),
        renderer: Phaser.AUTO,
        antialias: true,
        multiTexture: true,
        state: {
          preload: this.preload,
          create: this.create,
          update: this.update
        },
        parent: this.parent
      };

      this.game = new Phaser.Game(config);

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
    });

    socketProvider.connect();
    socketProvider.on('pingback', data => {
      console.log('ping: ' + (GameProvider.Instance.game.time.totalElapsedSeconds() - data));
    });
    socketProvider.on('enemy-connected', data => {
      this.enemyConnected(data);
    });
    socketProvider.on('enemy-disconnected', data => {
      this.enemyDisconnected(data);
    })
    socketProvider.on('enemy-move', data => {
      this.enemyMove(data);
    });
    socketProvider.on('enemy-shoot', data => {
      this.enemyShoot(data);
    });
    socketProvider.on('player-hit', data => {
      this.playerHit(data);
    });
    socketProvider.on('enemy-hit', data => {
      this.enemyHit(data);
    });
    socketProvider.on('enemy-dead', data => {
      this.enemyDead(data);
    });
    socketProvider.on('player-scored', data => {
      this.playerScored(data);
    });

    socketProvider.on('bullet-id-assign', data => {
      Bullet.bIdAssign(data);
    });
  }

  enemyDisconnected(data) : void
  {
    let i = this.enemies.findIndex((enemy: Enemy) => { return enemy.Id == data.id });
    let en = this.enemies[i];
    if(en)
    {
      en.displayName.destroy();
      en.destroy(true);
      delete this.enemies[i];
      this.enemies.splice(i, 1);
    }
  }
  enemyConnected(data) : void
  {
    //o primeiro que se conecta depois do primeiro duplica o objeto do primeiro a se conectar
    let exists = this.enemies.find((e : Enemy) => {
      return e.Id == data.id;
    });

    if(!exists)
    {
      console.log('user ' + data.id + ' connected!');
      let enemy : Enemy = new Enemy(this.game, data.pos, 'ball', data.id);
      this.enemies.push(enemy);
      enemy.setName(data.name);
    }
  }
  enemyMove(data) : void
  {
    let en = this.enemies.find((enemy : Enemy) => { return enemy.Id == data.id });
    if(en)
    {
      en.position = new Phaser.Point(data.pos.x, data.pos.y);
      en.moveDir = new Phaser.Point(data.dir.x, data.dir.y);
    }
  }
  enemyShoot(data) : void 
  {
    let b = new Bullet(this.game, data.pos.x, data.pos.y, 'bullet');
    b.ownerId = data.id;
    b.remoteId = data.bRemoteId;
    b.init(new Phaser.Point(data.dir.x, data.dir.y), 200);
  }

  playerHit(data) : void
  {
    if(this.player.hit(data.damage).dead)
    {
      this.player.die(data.bulletOwner);
    }
    Bullet.Destroy(data.bRemoteId);
  }
  playerScored(data) : void
  {
    this.player.score += 10;
  }

  enemyHit(data) : void
  {
    Bullet.Destroy(data.bRemoteId);
  }

  enemyDead(data) : void
  {
    let en = this.enemies.find((enemy : Enemy) => { return enemy.Id == data.id });
    if(en)
    {
      en.position = new Phaser.Point(data.pos.x, data.pos.y);
      en.die();
      this.enemyDisconnected(data);
    }
  }

  preload() : void
  {
    this.game.load.image('sky',  'assets/space3.png');
    this.game.load.image('red',  'assets/red.png');
    this.game.load.image('ball', 'assets/ball.png');
    this.game.load.image('bullet', 'assets/bullet.png');
    this.game.load.image('healthBar', 'assets/HealthBar.png');
    this.game.load.spritesheet('button', 'assets/Button.png', 516, 516);
    this.game.world.setBounds(0, 0, 1920, 1920);
  }
  tiledBG : Phaser.TileSprite;
  create() : void 
  {
    this.game.stage.disableVisibilityChange = true;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    GameProvider.Instance.socketProvider.emit('pinga', this.game.time.totalElapsedSeconds());

    this.tiledBG = this.game.add.tileSprite(0, 0, 1920,1920, 'sky');

    this.fireButton = this.game.add.button(0, this.game.camera.height- 100, 'button',() =>console.log("pressed down"), this.game,0,0,1);
    this.fireButton.fixedToCamera = true;
    this.fireButton.scale = new Phaser.Point(0.2,0.2);
  }

  createPlayer(name)
  {
    {
      this.player = new Player(this.game, new Phaser.Point(this.game.world.centerX, this.game.world.centerY), 'ball');
      this.player.setName(name);
      this.player.anchor.setTo(0.5);
      GameProvider.Instance.player = this.player;
      this.game.camera.follow(this.player);
      this.player.connectToServer();
      this.Initialized = true;
    }
  }
  changeToLeaderboards()
  {
    this.homePage.goToLeaderboards();
  }
  update() : void
  {
    if(GameProvider.Instance.player)
    {
      let firing = false;
      let ptrs = this.game.input.pointers;

      let movePos = null;

      for(let i = 0; i < ptrs.length; ++i)
      {
        if(ptrs[i].isDown)
        {
          if(this.fireButton.getBounds().contains(ptrs[i].x, ptrs[i].y))
          {
            firing = true;
          }
          else
          {
            movePos = new Phaser.Point(ptrs[i].worldX, ptrs[i].worldY);
          }

          if(firing && movePos)
            break;
        }
      }

      if(firing || this.game.input.keyboard.isDown(Phaser.KeyCode.F))
      {
        GameProvider.Instance.player.firing = true;
        this.fireButton.frame = 1;
        GameProvider.Instance.player.stop();
      }
      else
      {
        GameProvider.Instance.player.firing = false;
        this.fireButton.frame = 0;
      }

      if(movePos)
      {
        GameProvider.Instance.player.move(movePos);
        GameProvider.Instance.player.lastMoved = true;
      }
      else
      {
        GameProvider.Instance.player.lastMoved = false;
        GameProvider.Instance.player.stop();
      }
    }
  }

}
