import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, Alert , NavParams} from 'ionic-angular';
import { GameProvider } from '../../providers/game/game';
import { AlertController } from 'ionic-angular';
import { LeaderboardsPage } from '../../pages/leaderboards/leaderboards';
import { linkToSegment } from 'ionic-angular/umd/navigation/nav-util';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage
{
  @ViewChild('gameArea')
  gameArea : ElementRef;

  game : Phaser.Game;

  interval;

  alert : Alert;

  ngAfterViewInit()
  {
    this.interval = setInterval(() => {
      if(this.gameProvider.Parent != null)
      {
        this.gameArea.nativeElement.appendChild(this.gameProvider.Parent);
        clearInterval(this.interval);
      }
    });
  }
  ionViewDidLoad()
  {
    console.log("on view did load");
    this.askForName();
  }

  constructor(public navCtrl: NavController, public navParams: NavParams, private gameProvider : GameProvider, private alertCtrl: AlertController) 
  {
    gameProvider.homePage = this;
  }
  askForName() 
  {
    let self = this;
    this.alert = this.alertCtrl.create({
      title: 'Choose your name',
      message: 'Choose your display name in-game',
      inputs: [
        {
          name: 'name',
          placeholder: 'your nickname...'
        },
      ],
      buttons: [
        {
          text: 'Start Game',
          handler: (inputs) => {
            self.startGame(inputs.name);
          }
        }
      ]
    });

    this.alert.present();
  }
  deadPopup(playerName: string)
  {
    let self = this;
    this.alert = this.alertCtrl.create({
      message: 'You died!',
      buttons: [
        {
          text: 'Respawn',
          handler: () => {
            GameProvider.Instance.createPlayer(playerName);
          }
        }
      ]
    });
    this.alert.present();
  }
  goToLeaderboards()
  {
    this.navCtrl.push(LeaderboardsPage);
  }
  startGame(text)
  {
    this.gameProvider.createPlayer(text);
  }
  ionViewDidEnter()
  {
    let param = this.navParams.get('wasThere');
    console.log(param);
    if (param) 
    {
      this.deadPopup(GameProvider.Instance.player.name);
      GameProvider.Instance.player.respawn();
    } 
  }
}
