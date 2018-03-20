import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { LocationTracker } from '../../services/locationtracker.service';
import { Dateformater } from '../../services/dateformater.service';
import { Device } from '@ionic-native/device';

import { HTTP } from '@ionic-native/http';

const DATABASE_APEX_NAME: string = 'dataApex.db';
const SERVEUR_APEX_NAME: string = 'http://www.gbrunel.fr/ionic/';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private db: SQLiteObject;
  private dataUser: any[];
  private dataSesion: any[];
  private dataObservation: any[];
  public filter: string = 'date';
  public baseURI: string = SERVEUR_APEX_NAME;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public dateformater: Dateformater,
    private sqlite: SQLite,
    public device: Device,
    private http: HTTP,
    public locationTracker: LocationTracker) {
      
    this.createDatabaseApex();
    this.startGeolocation();
    this.infophone()
  }

  public infophone(){
    console.log('UUID : '+this.device.uuid);
    console.log('serial : '+this.device.serial);
    console.log('model : '+this.device.model);
    console.log('platform : '+this.device.platform);
    console.log('version : '+this.device.version);
  }

  public startGeolocation(){
    this.locationTracker.startTracking();
  }
 
  public stopGeolocation(){
    this.locationTracker.stopTracking();
  }

  public openAuthentication() {
    var authenticationModal = this.modalCtrl.create('AuthenticationPage');
    authenticationModal.onDidDismiss(() => {
      this.retrieveUser();
    });
    authenticationModal.present();     
  }

  public openModal() {
    var data = { iduser: this.dataUser[0].id };
    var apexModal = this.modalCtrl.create('ApexmodalPage', data);
    apexModal.onDidDismiss(() => {
      this.retrieveSession();
    });
    apexModal.present();
  }

  public openSaisieApex() {
    var data = { iduser: this.dataUser[0].id };
    var apexSaisie = this.modalCtrl.create('ApexSaisieRangPage', data);
    apexSaisie.onDidDismiss(() => {
      this.retrieveSession();
    });
    apexSaisie.present();
  }

  private createDatabaseApex(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB created !');
        this.db = db;
        this.createTables();
      })
      .catch(e => console.log(e));
  }

  private createTables(): void {
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `structure` TEXT NOT NULL, `name` TEXT )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session` ( `idSession` TEXT NOT NULL UNIQUE, `name` TEXT, `score` INTEGER NOT NULL, `date` INTEGER NOT NULL, `userId` TEXT NOT NULL, PRIMARY KEY(`idSession`), FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`) )', {})
          .then(() => {
            console.log('Session table created');
            this.db.executeSql('CREATE TABLE IF NOT EXISTS `Observation` ( `idObservation` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `apexValue` TEXT NOT NULL, `date` INTEGER NOT NULL, `latitude` NUMERIC NOT NULL, `longitude` NUMERIC NOT NULL, `sessionId` TEXT NOT NULL, FOREIGN KEY(`sessionId`) REFERENCES `Session`(`idSession`) )', {})
              .then(() => {
                console.log('Observation table created');
                this.retrieveUser();
                this.retrieveSession();
              })
              .catch(e => console.log('fail table Observation | ' + e));
          })
          .catch(e => console.log('fail table Session | ' + e));
      })
      .catch(e => console.log('fail table User | ' + e));
  }


  public retrieveUser() {
    this.db.executeSql('select * from `User` order by idUser desc',{})
    .then((data) => {
      if(data == null){
        return;
      }
      if (data.rows) {
        if (data.rows.length > 0) {
          this.dataUser = [];
          for (let i = 0; i < data.rows.length; i++) {
            this.dataUser.push({
              id:data.rows.item(i).idUser,
              structure :data.rows.item(i).structure,
              name: data.rows.item(i).name
            });            
          }
          console.log('idUser : '+this.dataUser[0].id);
        } 
        else {
          this.openAuthentication();
        }
      }

    })
    .catch(e => console.log('fail sql retrieve User '+ e));
  }

  public retrieveSession() {
    var filter = this.filter;
    console.log(this.filter);
    var sqlrequest = 'select * from `Session` order by '+filter+' desc';
    if (filter == 'name') {
      sqlrequest = 'select * from `Session` order by '+filter+' asc';
    } 
    
    this.db.executeSql(sqlrequest,{})
    .then((data) => {
      if(data == null){
        console.log('no session yet');
        return;
      }
      if (data.rows) {
        if (data.rows.length > 0) {
          this.dataSesion = [];
          console.log('Push data session');
          for (let i = 0; i < data.rows.length; i++) {
            var date = this.dateformater.convertToDate(data.rows.item(i).date);
            var time = this.dateformater.convertToTime(data.rows.item(i).date);
            var score = this.convertInteger(data.rows.item(i).score);
            this.dataSesion.push({
              id:data.rows.item(i).idSession,
              name: data.rows.item(i).name,
              score: score,
              date: date,
              time: time,
              userId: data.rows.item(i).userId
            });            
          }
        }
      }
    })
    .catch(e => console.log('fail sql retrieve Sessions '+ e));
  }

  public retrieveObservation() {
    this.db.executeSql('select * from `Observation` order by idObservation desc',{})
    .then((data) => {
      if(data == null){
        console.log('no session yet');
        return;
      }
      if (data.rows) {
        if (data.rows.length > 0) {
          this.dataObservation = [];
          for (let i = 0; i < data.rows.length; i++) {
            this.dataObservation.push({
              id:data.rows.item(i).idObservation,
              apex :data.rows.item(i).apexValue,
              date: data.rows.item(i).date,
              lat: data.rows.item(i).latitude,
              lng: data.rows.item(i).longitude,
              idSession: data.rows.item(i).sessionId
            });            
          }
        }
      }
    })
    .catch(e => console.log('fail sql retrieve Observation '+ e));
  }

  public convertInteger(x) {
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }

  public deleteEntry(id) {
    let confirm = this.alertCtrl.create({
      title: 'Vous voulez supprimer les données de cette parcelle ?',
      //message: 'Do you agree to use this lightsaber to do good across the intergalactic galaxy?',
      buttons: [
        {
          text: 'non',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Supprimer',
          handler: () => {
            this.deleteObservation(id);
            this.deleteSession(id);
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

    //Delete session
    public deleteSession(id):void{
      var idSession = id;
      this.db.executeSql('DELETE FROM `Session` WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session '+idSession+' deleted');
        this.retrieveSession();
      })
      .catch(e => console.log(e));
    }
  
    //Delete observations
    public deleteObservation(id):void{
      var idSession = id;
      this.db.executeSql('DELETE FROM `Observation` WHERE sessionId = ?', [idSession])
      .then(() => console.log('Observations '+idSession+' deleted'))
      .catch(e => console.log(e));
    }

    postEntryToServe(data) : void
    {
      console.log(data[0].key+' - '+data[0].idUser+' - '+data[0].structure+' - '+data[0].name);
      let headers 	: any		= { 'Content-Type': 'application/json' };
      let options 	: any		= {key: 'user', idUser: 'CMB', structure: 'AGS', name: 'Bru'};
      let url       : any  	= this.baseURI + 'apiApex.php';

      this.http.setDataSerializer('json');
      this.http.post(url, options, headers)
          .then(data => {
            console.log(data);
        })
          .catch(error => console.log('Fail Serve '+error));
    }

    public addUserServeur() {
      this.db.executeSql('select * from `User` order by idUser desc',{})
      .then((data) => {
        if(data == null){
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            var dataUsersOption = [];
            for (let i = 0; i < data.rows.length; i++) {
              dataUsersOption.push({
                key:'user',
                idUser:data.rows.item(i).idUser,
                structure :data.rows.item(i).structure,
                name: data.rows.item(i).name
              });            
              console.log(dataUsersOption[0].key+' - '+dataUsersOption[0].idUser+' - '+dataUsersOption[0].structure+' - '+dataUsersOption[0].name);
              this.postEntryToServe(dataUsersOption);
            }
          } 
          else {
            return;
          }
        }
  
      })
      .catch(e => console.log('fail sql retrieve User '+ e));
    }
    
}