import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule, AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuthModule, AngularFireAuth } from '@angular/fire/auth';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { LeaderboardsPage } from '../pages/leaderboards/leaderboards';
import { LoginPage } from '../pages/login/login';
import { SignupPage } from '../pages/signup/signup';

import { GameProvider } from '../providers/game/game';
import { DatabaseProvider } from '../providers/database/database';
import { SocketIoProvider } from '../providers/socket-io/socket-io';
import { SocketIoModule, SocketIoConfig } from 'ng-socket-io';
import { AuthProvider } from '../providers/auth/auth';
import { NgxErrorsModule } from '@ultimate/ngxerrors';

const sioconfig : SocketIoConfig = { url: "http://cf4a0106.ngrok.io/", options: {} };

var config = {
  apiKey: "AIzaSyCqebdJfVgJXXVxL99AsgLiF0VLNfDP11o",
  authDomain: "trabalho-gb-dab40.firebaseapp.com",
  databaseURL: "https://trabalho-gb-dab40.firebaseio.com",
  projectId: "trabalho-gb-dab40",
  storageBucket: "trabalho-gb-dab40.appspot.com",
  messagingSenderId: "600944534104"
};


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    SignupPage,
    LeaderboardsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(config),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    SocketIoModule.forRoot(sioconfig),
    NgxErrorsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    SignupPage,
    LeaderboardsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    GameProvider,
    AngularFireAuth,
    DatabaseProvider,
    SocketIoProvider,
    AuthProvider
  ]
})
export class AppModule {}
