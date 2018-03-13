import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';

import { Device } from '@ionic-native/device';
import { Vibration } from '@ionic-native/vibration';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { LocationTracker } from '../../services/locationtracker.service';
import { GUIDGenerator } from '../../services/guidgenerator.service';
import { Dateformater } from '../../services/dateformater.service';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-apex-saisie-rang',
  templateUrl: 'apex-saisie-rang.html',
})
export class ApexSaisieRangPage {

  private db: SQLiteObject;

  public c_array: number;
  public r_array: number;
  public p_array: number;
  public guidsession: string;
  public idUser: number;
  public numeroSession: number;
  public nameSession: string;

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

      console.log('try open DB');
      this.openDataBase();
      this.initializeVariable();
      this.idUser = this.navParams.get('iduser');
    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ApexmodalPage');

  }

  private initializeVariable():void{
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
        this.getNextIndexSession();
      })
      .catch(e => console.log(e));
  }
 
  public getNextIndexSession(){
    this.db.executeSql('SELECT COUNT(*) as rowcount FROM `Session`',{})
    .then((data) => {
      if(data == null){
        console.log('no session yet');
        return;
      }
      if (data.rows) {
        if (data.rows.length > 0) {
          this.numeroSession = data.rows.item(0).rowcount+1;
        }
      }
    })
    .catch(e => console.log('fail sql retrieve Sessions '+ e));
  }

  async saveObservation(apexvalue){
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

  async saveSession(){
    var idSession = this.guidsession;
    var name = 'Session N°' + this.numeroSession;
    if (this.nameSession != null) {
      name = this.nameSession; 
    } 
    var score = this.computeScore();
    var date = this.dateformater.gettimestamp();
    var uuidPhone = this.device.uuid;
    var userId = this.idUser;

    console.log('GUID Session : '+ idSession);
    console.log('Name Session : '+ name);
    console.log('Date Session : '+ date);
    console.log('uuidPhone Session : '+ uuidPhone);
    console.log('userId Session : '+ userId);

    this.db.executeSql('INSERT INTO `Session` (idSession, name, score, date, uuidPhone, userId) VALUES(?,?,?,?,?,?)',
     [idSession,name,score,date,uuidPhone,userId])
      .then(() => console.log('insert session OK'))
      .catch(e => console.log('fail insert session : '+e));
  }

  public computeScore():any{
    let p:number = +this.p_array;
    let r:number = +this.r_array;
    let c:number = +this.c_array;
    let totalentity = p + r + c;
    let p_purcent = (p * 100 / totalentity)/100;
    let r_purcent = (r * 100 / totalentity)/100;
    let c_purcent = (c * 100 / totalentity)/100;
    return (100/3)*((1-p_purcent)+(r_purcent)+(2*c_purcent));
  }

  async saveObservationLoops(){
    for (let i = 0; i < this.p_array; i++) {
      this.saveObservation('P');
    }
    for (let i = 0; i < this.r_array; i++) {
      this.saveObservation('R');
    }
    for (let i = 0; i < this.c_array; i++) {
      this.saveObservation('C');
    }
  }

  public closeModal(){
    if(this.p_array == null)this.p_array = 0;
    if(this.c_array == null)this.c_array = 0;
    if(this.r_array == null)this.r_array = 0;

    if(this.p_array == 0 && this.r_array == 0 && this.c_array == 0){
      this.viewCtrl.dismiss();
    }
    else{
      this.saveObservationLoops().then(() => {
        this.saveSession().then(() => {
          this.showResult();
        })
        .catch();
      })
      .catch();
      this.viewCtrl.dismiss();
    }
  }

  showResult() {
    var score = this.convertInteger(this.computeScore());
    let alert = this.alertCtrl.create({
      title: 'IAC : '+score,
      //subTitle: 'Your friend, Obi wan Kenobi, just accepted your friend request!',
      buttons: ['OK']
    });
    alert.present();
  }
  public convertInteger(x) {
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }
}
