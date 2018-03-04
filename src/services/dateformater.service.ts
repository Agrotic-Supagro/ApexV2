import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { DatePipe } from '@angular/common';

@Injectable()
export class Dateformater {

  constructor() {}

  gettimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  gettime() {
    var myDate = new Date();
    var datePipe = new DatePipe('fr-FR');
    return datePipe.transform(myDate, 'HH:mm:ss');
  }

  getdate() {
    var myDate = new Date();
    var datePipe = new DatePipe('fr-FR');
    return datePipe.transform(myDate, 'yyyy-MM-dd');
  }
}

