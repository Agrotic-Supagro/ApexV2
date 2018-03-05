import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { LocationTracker } from '../../services/locationtracker.service';

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
    public navCtrl: NavController,
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
    var data = { iduser: 1 };
    var apexModal = this.modalCtrl.create('ApexmodalPage', data);
    apexModal.present();
  }

  public openSaisieApex() {
    var data = { iduser: 1 };
    var apexSaisie = this.modalCtrl.create('ApexSaisieRangPage', data);
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
                this.createDefaultUser();
              })
              .catch(e => console.log('fail table Observation | ' + e));
          })
          .catch(e => console.log('fail table Session | ' + e));
      })
      .catch(e => console.log('fail table User | ' + e));
  }

  private createDefaultUser(): void {
    var structure = 'CA34';
    var name = '';
    this.db.executeSql('INSERT INTO `User` (structure, name) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE structure=? AND name=?)', [structure,name,structure,name])
      .then(() => {
        console.log('Default CA34 Users created');
        structure = 'AgroTIC';
        name = '';
        this.db.executeSql('INSERT INTO `User` (structure, name) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE structure=? AND name=?)', [structure,name,structure,name])
          .then(() => console.log('Default AgroTIC Users created'))
          .catch(e => console.log(e));
      })
      .catch(e => console.log(e));
  }

  public retrieveUser() {
    this.db.executeSql('select * from `User` order by idUser desc',{})
    .then((data) => {
      if(data == null){
        console.log('no session yet');
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
      }
    })
    .catch(e => console.log('fail sql retrieve User '+ e));
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
            this.dataSesion.push({
              id:data.rows.item(i).idSession,
              name: data.rows.item(i).name,
              score: data.rows.item(i).score,
              date: data.rows.item(i).date,
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
              idSession: data.rows.item(i).idSession
            });            
          }
        }
      }
    })
    .catch(e => console.log('fail sql retrieve Observation '+ e));
  }


  
}

