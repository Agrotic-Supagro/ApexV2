import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';
import { Dateformater } from './dateformater.service';


const DATABASE_APEX_NAME: string = 'dataApex.db';

@Injectable()
export class ApexData {

  public db;
  public dataUsers: any[];
  public dataSessions: any[];

  public dataForServe:any[];
  public dataObservationsServe: any[];

  constructor(private sqlite: SQLite,
    public dateformater: Dateformater,
    public device: Device){
      this.openDataBase();
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

  public dropTables(){
    this.db.executeSql('DROP TABLE IF EXISTS `User`', {})
    .then(() => {})
    .catch(e => console.log('fail drop table User | ' + e));

    this.db.executeSql('DROP TABLE IF EXISTS `Session`', {})
    .then(() => {})
    .catch(e => console.log('fail drop table Session | ' + e));

    this.db.executeSql('DROP TABLE IF EXISTS `Observation`', {})
    .then(() => {})
    .catch(e => console.log('fail drop table Observation | ' + e));
  }

  //---------- GET METHODS FOR DISPLAY ----------
  public getSessions(){
      this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session`( `idSession` TEXT NOT NULL UNIQUE, `nomParcelle` TEXT, `date` INTEGER NOT NULL, `globalLatitude` REAL, `globalLongitude` REAL, `apexP` INTEGER, `apexR` INTEGER, `apexC` INTEGER, `iac` REAL, `moyenne` REAL, `tauxApexP` REAL, `userId` TEXT NOT NULL, `serve` INTEGER DEFAULT 0, FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`), PRIMARY KEY(`idSession`) )', {})
      .then(() => {
        this.db.executeSql('select * from `Session` where serve=0 or serve=1 order by date desc', {})
          .then((data) => {
            this.dataSessions = [];
            if (data == null) {
              return;
            }
            else if (data.rows) {
              if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                  var date = this.dateformater.convertToDate(data.rows.item(i).date);
                  var time = this.dateformater.convertToTime(data.rows.item(i).date);
                  var iac = this.convertInteger(data.rows.item(i).iac);
                  var moyenne = data.rows.item(i).moyenne.toFixed(2);
                  var tauxApexP = data.rows.item(i).tauxApexP.toFixed(1);
                  var affichage = this.computeAffichage(moyenne,tauxApexP,iac);
                  this.dataSessions.push({
                    id: data.rows.item(i).idSession,
                    nomParcelle: data.rows.item(i).nomParcelle,
                    date: date,
                    time: time,
                    globalLatitude: data.rows.item(i).globalLatitude,
                    globalLongitude: data.rows.item(i).globalLongitude,
                    apexP: data.rows.item(i).apexP,
                    apexR: data.rows.item(i).apexR,
                    apexC: data.rows.item(i).apexC,
                    iac: iac,
                    moyenne: moyenne,
                    tauxApexP: tauxApexP,
                    userId: data.rows.item(i).userId,
                    affichage:affichage
                  });
                }
                this.dataSessions;
              } 
              else this.dataSessions;
            }
          })
          .catch(e => console.log('fail retrieve Sessions | ' + e));
      })
      .catch(e => console.log('fail create table Sessions | ' + e));
  }

  
  public getUserObs() {
    return Observable.of('bite');
  }

  public getUsers(){
    return new Promise((resolve, reject) => {
      this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        this.db.executeSql('select * from `User` order by idUser desc', {})
          .then((data) => {
            this.dataUsers = [];
            if (data == null) {
              return;
            }
            else if (data.rows) {
              if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                  this.dataUsers.push({
                    id: data.rows.item(i).idUser,
                    name: data.rows.item(i).name,
                    email: data.rows.item(i).email,
                    structure: data.rows.item(i).structure
                  });
                }
                resolve (this.dataUsers);
              } 
              else resolve (this.dataUsers);
            }
          })
          .catch(e => reject('fail retrieve Users | ' + e));
      })
      .catch(e => reject('fail create table User | ' + e));
    });
  }

  public getObservation(){
    return new Promise((resolve, reject) => {
      this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        this.db.executeSql('select * from `Observation` where serve=0', {})
          .then((data) => {
            this.dataObservationsServe = [];
            if (data == null) {
              return;
            }
            else if (data.rows) {
              if (data.rows.length > 0) {
                for (let i = 0; i < data.rows.length; i++) {
                  this.dataObservationsServe.push({
                    key: 'observation',
                    apexValue: data.rows.item(i).apexValue,
                    date: data.rows.item(i).date,
                    latitude: data.rows.item(i).latitude,
                    longitude: data.rows.item(i).longitude,
                    sessionId: data.rows.item(i).sessionId,
                    idObservation: data.rows.item(i).idObservation
                  });
                }
                resolve (this.dataObservationsServe);
              } 
              else resolve (this.dataObservationsServe);
            }
          })
          .catch(e => reject('fail retrieve Users | ' + e));
      })
      .catch(e => reject('fail create table User | ' + e));
    });
  }

  //---------- ADD METHODS ----------
  public addSession(){

  }

  public addUser(){

  }

  public addObservation(){

  }

  //---------- UPDATE METHODS ----------
  public updateSession(data):void{
    this.db.executeSql('UPDATE `Session` SET nomParcelle=?, iac=?, moyenne=?, tauxApexP=?, apexP=?, apexR=?, apexC=?  WHERE idSession=?', 
    [data.nomParcelle, data.iac, data.moyenne, data.tauxApexP, data.apexP, data.apexR, data.apexC, data.idSession])
    .then(() => {
      this.getSessions();
      console.log('Session updated');
    })
    .catch(e => console.log('Fail Update Session | '+e));
  }

  //---------- DELETE METHODS ----------
  /* Cette méthode ne delete pas les sessions mais update la valeur de 'serve' pour cacher la donnée à l'utilisateur*/
  public deleteSession(idSession){
    this.db.executeSql('UPDATE `Session` SET serve = 2 WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session ' + idSession + ' hidden');
        this.getSessions();
      })
      .catch(e => console.log('Fail "delete" Session | '+ e));
  }


  //---------- Fonction pour l'affichage ----------
  public computeAffichage(moyenne, tx, iac){
    if (moyenne > 1.5) {
      return 0;
    } else {
      if (tx > 5) {
        return 1;
      } else {
        if (iac < 80) {
          return 2;
        } else {
          return 3;
        }
      }
    }
  }
  public convertInteger(x) {
    return Number.parseInt(x);
  }

  //----------OLD METHODS---------------
  /*private cratesTablesV2(){
    return new Promise((resolve, reject) => {
      this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session`( `idSession` TEXT NOT NULL UNIQUE, `nomParcelle` TEXT, `date` INTEGER NOT NULL, `globalLatitude` REAL, `globalLongitude` REAL, `apexP` INTEGER, `apexR` INTEGER, `apexC` INTEGER, `iac` REAL, `moyenne` REAL, `tauxApexP` REAL, `userId` TEXT NOT NULL, `serve` INTEGER DEFAULT 0, FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`), PRIMARY KEY(`idSession`) )', {})
          .then(() => {
            console.log('Session table created');
            this.db.executeSql('CREATE TABLE IF NOT EXISTS `Observation` ( `idObservation` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `apexValue` TEXT NOT NULL, `date` INTEGER NOT NULL, `latitude` REAL NOT NULL, `longitude` REAL NOT NULL, `sessionId` TEXT NOT NULL, `serve`	INTEGER DEFAULT 0, FOREIGN KEY(`sessionId`) REFERENCES `Session`(`idSession`) )', {})
              .subscribe(res => {
                resolve(res);
              }, (err) => {
                reject(err);
              });
          })
          .catch(e => console.log('fail table Session | ' + e));
      })
      .catch(e => console.log('fail table User | ' + e));
    });
  }*/

  /*private createTables(): void {
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session`( `idSession` TEXT NOT NULL UNIQUE, `nomParcelle` TEXT, `date` INTEGER NOT NULL, `globalLatitude` REAL, `globalLongitude` REAL, `apexP` INTEGER, `apexR` INTEGER, `apexC` INTEGER, `iac` REAL, `moyenne` REAL, `tauxApexP` REAL, `userId` TEXT NOT NULL, `serve` INTEGER DEFAULT 0, FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`), PRIMARY KEY(`idSession`) )', {})
          .then(() => {
            console.log('Session table created');
            this.db.executeSql('CREATE TABLE IF NOT EXISTS `Observation` ( `idObservation` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `apexValue` TEXT NOT NULL, `date` INTEGER NOT NULL, `latitude` REAL NOT NULL, `longitude` REAL NOT NULL, `sessionId` TEXT NOT NULL, `serve`	INTEGER DEFAULT 0, FOREIGN KEY(`sessionId`) REFERENCES `Session`(`idSession`) )', {})
              .then(() => {
                console.log('Observation table created');
                this.getUserV0();
                this.getSessionsv0();
              })
              .catch(e => console.log('fail table Observation | ' + e));
          })
          .catch(e => console.log('fail table Session | ' + e));
      })
      .catch(e => console.log('fail table User | ' + e));
  }*/

  public getUserV0() {
    this.db.executeSql('select * from `User` order by idUser desc', {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            this.dataUsers = [];
            for (let i = 0; i < data.rows.length; i++) {
              this.dataUsers.push({
                id: data.rows.item(i).idUser,
                name: data.rows.item(i).name,
                email: data.rows.item(i).email,
                structure: data.rows.item(i).structure
              });
            }
            console.log('idUser : ' + this.dataUsers[0].id);
            return this.dataUsers;
          } else {
            return;
          }
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public getSessionsv0() {
    var sqlrequest = 'select * from `Session` where serve=0 or serve=1 order by date desc';
    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          this.dataSessions = [];
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              this.dataSessions.push({
                key: 'session',
                idSession: data.rows.item(i).idSession,
                nomParcelle: data.rows.item(i).nomParcelle,
                iac: data.rows.item(i).iac,
                date: data.rows.item(i).date,
                globalLatitude: data.rows.item(i).globalLatitude,
                globalLongitude: data.rows.item(i).globalLongitude,
                apexP: data.rows.item(i).apexP,
                apexR: data.rows.item(i).apexR,
                apexC: data.rows.item(i).apexC,
                moyenne: data.rows.item(i).moyenne,
                tauxApexP: data.rows.item(i).tauxApexP,
                serve:data.rows.item(i).serve,
                userId: data.rows.item(i).userId
              });
            }
          }
        }
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }


  //Delete session - Rend invisible la session à l'utilisation mais ne la supprime pas de la base
  public deleteSessionv0(id): void {
    var idSession = id;
    this.db.executeSql('UPDATE `Session` SET serve = 2 WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session ' + idSession + ' hidden');
        this.dataSessions = [];
        this.getSessionsv0();
      })
      .catch(e => console.log(e));
  }



}
 