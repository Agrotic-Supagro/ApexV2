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
    var day = this.zeroPad(myDate.getDate());
    var month = this.zeroPad(myDate.getMonth());
    var year = this.zeroPad(myDate.getFullYear());
    return day+'/'+month+'/'+year;
  }

  convertToDate(timestamp){
    var myDate = new Date (timestamp*1000);
    var day = this.zeroPad(myDate.getDate());
    var month = this.zeroPad(myDate.getMonth()+1);
    var year = this.zeroPad(myDate.getFullYear());
    return day+'/'+month+'/'+year;
  }

  convertToTime(timestamp){
    var myDate = new Date (timestamp*1000);
    var hours = myDate.getHours();
    var minutes = this.zeroPad(myDate.getMinutes());
    return hours+'h'+minutes;
  }



  zeroPad(n) {
    return n<10 ? '0'+n : n
  }
}

