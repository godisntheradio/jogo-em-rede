import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { HomePage } from '../../pages/home/home';
/**
 * Generated class for the LeaderboardsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-leaderboards',
  templateUrl: 'leaderboards.html',
})
export class LeaderboardsPage {
  leaderboard : any[] = [];
  wasInLeaderboards : boolean = false;
  constructor(public navCtrl: NavController, public navParams: NavParams, public dbProvider : DatabaseProvider) 
  {
    dbProvider.list.subscribe((data)=>{
      this.leaderboard = [];
      data.forEach(element => {
        this.leaderboard.push({nickname : element.nickname, score : element.score });
      });
      this.leaderboard.sort((a,b)=>{
        return  b.score - a.score;
      })
    });
  }

  ionViewDidEnter() 
  {
    this.wasInLeaderboards = true;
  }
  continue()
  {
    this.navCtrl.getPrevious().data.wasThere = this.wasInLeaderboards;
    this.navCtrl.pop();
  }
  ionViewDidLeave()
  {
    this.wasInLeaderboards = false;
  }
}
