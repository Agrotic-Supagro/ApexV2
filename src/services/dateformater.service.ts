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

  convertToDate(timestamp){
    var myDate = new Date (timestamp*1000);
    var day = this.zeroPad(myDate.getDate(),2);
    var month = this.zeroPad(myDate.getMonth(),2);
    var year = this.zeroPad(myDate.getFullYear(),2);
    return day+'/'+month+'/'+year;
  }

  convertToTime(timestamp){
    var myDate = new Date (timestamp*1000);
    var hours = myDate.getHours();
    var minutes = this.zeroPad(myDate.getMinutes(),2);
    return hours+':'+minutes;
  }



  zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  }
}

