import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';

import { Dateformater } from './dateformater.service';

import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';

const DATABASE_APEX_NAME: string = 'dataApex.db';
const SERVEUR_APEX_NAME: string = 'http://www.gbrunel.fr/ionic/';

@Injectable()
export class RetrieveDATA {

  public db;
  public baseURI: string = SERVEUR_APEX_NAME;
  private dataUser: any[];
  private dataSesion: any[];

  constructor(private sqlite: SQLite,
    private network: Network,
    public device: Device,
    private http: HTTP,
    public dateformater: Dateformater){

  }

  private openDB(): void {
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

  private createTables(): void {
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session`( `idSession` TEXT NOT NULL UNIQUE, `nomParcelle` TEXT, `date` INTEGER NOT NULL, `globalLatitude` REAL, `globalLongitude` REAL, `apexP` INTEGER, `apexR` INTEGER, `apexC` INTEGER, `iac` REAL, `moyenne` REAL, `tauxApexP` REAL, `userId` TEXT NOT NULL, `serve` INTEGER DEFAULT 0, FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`), PRIMARY KEY(`idSession`) )', {})
          .then(() => {
            console.log('Session table created');
            this.db.executeSql('CREATE TABLE IF NOT EXISTS `Observation` ( `idObservation` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `apexValue` TEXT NOT NULL, `date` INTEGER NOT NULL, `latitude` REAL NOT NULL, `longitude` REAL NOT NULL, `sessionId` TEXT NOT NULL, `serve`	INTEGER DEFAULT 0, FOREIGN KEY(`sessionId`) REFERENCES `Session`(`idSession`) )', {})
              .then(() => {
                console.log('Observation table created');
                this.getUser();
                this.getSessions();
              })
              .catch(e => console.log('fail table Observation | ' + e));
          })
          .catch(e => console.log('fail table Session | ' + e));
      })
      .catch(e => console.log('fail table User | ' + e));
  }

  public getUser() {
    this.db.executeSql('select * from `User` order by idUser desc', {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            this.dataUser = [];
            for (let i = 0; i < data.rows.length; i++) {
              this.dataUser.push({
                id: data.rows.item(i).idUser,
                name: data.rows.item(i).name,
                email: data.rows.item(i).email,
                structure: data.rows.item(i).structure
              });
            }
            console.log('idUser : ' + this.dataUser[0].id);
          } else {
            //this.openAuthentication();
          }
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public getSessions() {
    var sqlrequest = 'select * from `Session` where serve=0 or serve=1 order by date desc';
    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            this.dataSesion = [];
            for (let i = 0; i < data.rows.length; i++) {
              this.dataSesion.push({
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
  public deleteSession(id): void {
    var idSession = id;
    this.db.executeSql('UPDATE `Session` SET serve = 2 WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session ' + idSession + ' hidden');
        this.dataSesion = [];
        this.getSessions();
      })
      .catch(e => console.log(e));
  }

  public updateSession():void{
    var idSession;
    var nomParcelle;
    var iac;
    var moyenne;
    var tauxApexP;
    var apexP
    var apexR;
    var apexC;
    console.log('try update Session table')
     this.db.executeSql('UPDATE `Session` SET nomParcelle=?, iac=?, moyenne=?, tauxApexP=?, apexP=?, apexR=?, apexC=?  WHERE idSession=?', 
    [nomParcelle, iac, moyenne, tauxApexP, apexP, apexR, apexC, idSession])
    .then(() => console.log('Session updated'))
    .catch(e => console.log(e));
  }

}
 