import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs/Observable';
import { AuthProvider} from '../auth/auth';
/*
  Generated class for the DatabaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class DatabaseProvider {
  list : Observable<any[]> = new Observable<any[]>() ;
  constructor(public afDB: AngularFireDatabase, public auth : AuthProvider ) 
  {
    this.list = afDB.list('leaderboards').valueChanges();

  }

  postScore(nickname : string, score : number)
  {
    this.afDB.list('leaderboards').push({nickname : nickname, score : score, uid : this.auth.user.uid });
  }

  test()
  {
    this.afDB.list('leaderboards').push({nickname : "ohohoh", score : 5000, uid : 1 });
  }

}
