import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';

import { Device } from '@ionic-native/device';
import { Vibration } from '@ionic-native/vibration';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { LocationTracker } from '../../services/locationtracker.service';
import { GUIDGenerator } from '../../services/guidgenerator.service';
import { Dateformater } from '../../services/dateformater.service';

const THRESHOLD_APEX: number = 50;
const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-apexmodal',
  templateUrl: 'apexmodal.html',
})
export class ApexmodalPage {

  private db: SQLiteObject;
  private c_array: number;
  private r_array: number;
  private p_array: number;
  public numberApex: number = 0;
  public thresholdApex: number = THRESHOLD_APEX;
  public guidsession: string;
  public idUser: number;

  constructor(
    public vibration: Vibration,
    public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public device: Device,
    public sqlite: SQLite,
    public navParams: NavParams,
    public locationTracker: LocationTracker,
    public dateformater: Dateformater,
    public guid: GUIDGenerator) {

      
      this.initializeVariable();
      this.idUser = this.navParams.get('iduser');
    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ApexmodalPage');
    console.log('try open DB');
    this.openDataBase();
  }

  private initializeVariable():void{
    this.c_array = 0;
    this.r_array = 0;
    this.p_array = 0;
    this.numberApex = 0;
    this.guidsession = this.guid.getGuid();
    console.log('GUID Session : '+this.guid.getGuid());
  }

  private openDataBase(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
      })
      .catch(e => console.log(e));
  }

  public apexAlert() {
    let alert = this.alertCtrl.create({
      title: 'Apex méthode',
      subTitle: this.thresholdApex+' apex minimums',
      buttons: ['Fermer']
    });
    alert.present();
  }
  
  public addvalue(apexvalue){
    this.vibration.vibrate(100);
    this.numberApex ++;
    this.saveObservation(apexvalue);

    if (apexvalue == "P") {
      this.p_array++;
    } else {
      if (apexvalue == "R") {
        this.r_array++;
      } else {
        this.c_array++;
      }
    }
  }

  public saveObservation(apexvalue):void{
    console.log('timestamp : '+this.dateformater.gettimestamp());
    console.log('Lat : '+this.locationTracker.getLatitude());
    console.log('Lng : '+this.locationTracker.getLongitude());

    var lat = this.locationTracker.getLatitude();
    var lng = this.locationTracker.getLongitude();
    var timestamp = this.dateformater.gettimestamp();
    var apex = apexvalue; 

    this.db.executeSql('INSERT INTO `Observation` (apexValue, date, latitude, longitude, sessionId) VALUES(?,?,?,?,?)',
     [apex,timestamp,lat,lng,this.guidsession])
      .then(() => console.log('insert observation OK'))
      .catch(e => console.log('fail insert observation : '+e));
  }

  public saveSession():void{
    console.log('timestamp Session : '+this.dateformater.gettimestamp());
    console.log('Lat Session : '+this.locationTracker.getLatitude());
    console.log('Lng Session : '+this.locationTracker.getLongitude());
    console.log('GUID Session : '+ this.guidsession);

    var idSession = this.guidsession;
    var name = ""; // TODO
    var score = this.computeScore();
    var date = this.dateformater.gettimestamp();
    var uuidPhone = this.device.uuid;
    var userId = this.idUser;

    this.db.executeSql('INSERT INTO `Session` (idSession, name, score, date, uuidPhone, userId) VALUES(?,?,?,?,?,?)',
     [idSession,name,score,date,uuidPhone,userId])
      .then(() => console.log('insert session OK'))
      .catch(e => console.log('fail insert session : '+e));
  }

  public computeScore():any{
    let totalentity = this.p_array + this.r_array + this.c_array;
    let p_purcent = (this.p_array * 100 / totalentity)/100;
    let r_purcent = (this.r_array * 100 / totalentity)/100;
    let c_purcent = (this.c_array * 100 / totalentity)/100;
    return (100/3)*((1-p_purcent)+(r_purcent)+(2*c_purcent));
  }

  public closeModal(){
    this.saveSession();
    this.viewCtrl.dismiss();
  }

}
