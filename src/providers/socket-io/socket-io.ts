import { Injectable } from '@angular/core';
import {Socket} from 'ng-socket-io';
@Injectable()
export class SocketIoProvider 
{
  a : number = 0;
  constructor(public socket : Socket) 
  {
  }
  connect()
  {
    this.socket.connect();
  }
  on(event : string, callback : Function) : void
  {
    this.socket.on(event, callback);
  }

  emit(event : string, data : any) : void
  {
    this.socket.emit(event, data);
  }
}
