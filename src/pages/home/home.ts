import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { LocationTracker } from '../../services/locationtracker.service';
import { Dateformater } from '../../services/dateformater.service';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private db: SQLiteObject;
  private dataUser: any[];
  private dataSesion: any[];
  private dataObservation: any[];

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public dateformater: Dateformater,
    private sqlite: SQLite,
    public locationTracker: LocationTracker) {
      
    this.createDatabaseApex();
    this.startGeolocation();
  }

  public startGeolocation(){
    this.locationTracker.startTracking();
  }
 
  public stopGeolocation(){
    this.locationTracker.stopTracking();
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
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `structure` TEXT NOT NULL, `name` TEXT )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session` ( `idSession` TEXT NOT NULL UNIQUE, `name` TEXT, `score` INTEGER NOT NULL, `date` INTEGER NOT NULL, `uuidPhone` TEXT, `userId` INTEGER NOT NULL, PRIMARY KEY(`idSession`), FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`) )', {})
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
        } 
        else {
          this.openAuthentication();
        }
      }

    })
    .catch(e => console.log('fail sql retrieve User '+ e));
  }

  public openAuthentication() {
    var authenticationModal = this.modalCtrl.create('AuthenticationPage');
    authenticationModal.present();     
  }

  public retrieveSession() {
    this.db.executeSql('select * from `Session` order by date desc',{})
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
            var score = this.convertInteger(data.rows.item(i).score);
            this.dataSesion.push({
              id:data.rows.item(i).idSession,
              name: data.rows.item(i).name,
              score: score,
              date: date,
              uuidPhone: data.rows.item(i).uuidPhone,
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

  convertInteger(x) {
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }
}