import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';

@Injectable()
export class GUIDGenerator {

  constructor() {
  }

  public getGuid():string {
    return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
      this.s4() + '-' + this.s4() + this.s4() + this.s4();
  }
  
  private s4():any {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  
}
 