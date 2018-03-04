import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
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
  public lat: number;
  public lng: number;
  public numberApex: number = 0;
  public thresholdApex: number = THRESHOLD_APEX;
  public guidsession: string;
  public guidobservation: string;
  public date: number;

  constructor(
    public vibration: Vibration,
    public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    private sqlite: SQLite,
    public navParams: NavParams,
    public locationTracker: LocationTracker,
    public dateformater: Dateformater,
    public guid: GUIDGenerator) {

      this.openDataBase();
    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ApexmodalPage');
    //this.paramtest = this.navParams.get('message');
  }

  private openDataBase(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
        //this.createTables();
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

  public saveObservation(apexvalue):void{
    console.log('timestamp : '+this.dateformater.gettimestamp());
    console.log('GUID Obs : '+this.guid.getGuid());
    console.log('Lat : '+this.locationTracker.getLatitude());
    console.log('Lng : '+this.locationTracker.getLongitude());

    this.guidobservation = this.guid.getGuid();
    this.lat = this.locationTracker.getLatitude();
    this.lng = this.locationTracker.getLongitude();
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
/*       this.sqlite.create({
        name: 'data.db',
        location: 'default'
      })
      .then((db: SQLiteObject) => {
        db.executeSql('CREATE TABLE IF NOT EXISTS datasession(id INTEGER PRIMARY KEY AUTOINCREMENT,id_session,apex,latitude,longitude,hour)', {})
        .then(() => console.log('Executed SQL'))
        .catch(e => console.log(e));
        var id_session = this.idsession;
        var apex = apexvalue;
        var latitude = this.locationTracker.getLatitude();
        var longitude = this.locationTracker.getLongitude();
        var hour = this.dateFormat.gettime();
        this.remplir = "Apex(" + apexvalue + ") - Coord ("+latitude.toFixed(4)+"/"+longitude.toFixed(4)+") ";
        setTimeout(() => {
          this.remplir = "";
        }, 1000);

        db.executeSql('INSERT INTO datasession(id_session,apex,latitude,longitude,hour) VALUES(?,?,?,?,?)', [id_session,apex,latitude,longitude,hour])
        .then(() => console.log('Executed SQL'))
        .catch(e => console.log(e));
      })
      .catch(e => console.log(JSON.stringify(e))); */

  }

  public saveSession():void{

  }

  public closeModal(){
      this.viewCtrl.dismiss();
  }

}
