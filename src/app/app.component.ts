import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthProvider } from '../providers/auth/auth';
import { HomePage } from '../pages/home/home';
import {LoginPage} from '../pages/login/login';
import { LeaderboardsPage } from '../pages/leaderboards/leaderboards';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = LoginPage;

  constructor(public platform: Platform,public statusBar: StatusBar, splashScreen: SplashScreen,private auth: AuthProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
    this.initializeApp();
  }
  initializeApp() {
    this.auth.afAuth.authState
      .subscribe(
        user => {
          if (user) {
            this.rootPage = HomePage;
          } else {
            this.rootPage = LoginPage;
          }
        },
        () => {
          this.rootPage = LoginPage;
        }
      );
  }
}

