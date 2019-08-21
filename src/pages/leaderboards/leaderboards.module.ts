import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LeaderboardsPage } from './leaderboards';

@NgModule({
  declarations: [
    LeaderboardsPage,
  ],
  imports: [
    IonicPageModule.forChild(LeaderboardsPage),
  ],
})
export class LeaderboardsPageModule {}
