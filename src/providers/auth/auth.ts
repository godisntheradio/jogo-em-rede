import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth/auth';
/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {
  public user: firebase.User;
  constructor(public afAuth: AngularFireAuth) {
    console.log('Hello AuthProvider Provider');
    afAuth.authState.subscribe(user => {
      this.setUser(user);
    });
  }
  setUser(user : firebase.User)
  {
    this.user = user;
  }
  signInWithEmail(credentials) {
		console.log('Sign in with email');
		return this.afAuth.auth.signInWithEmailAndPassword(credentials.email,
			 credentials.password);
  }
  signUp(credentials) {
    return this.afAuth.auth.createUserWithEmailAndPassword(credentials.email, credentials.password);
  }
}
