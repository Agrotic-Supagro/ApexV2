import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Subscription} from 'rxjs/Subscription';

import { LocationTracker } from '../../services/locationtracker.service';
import { Dateformater } from '../../services/dateformater.service';
import { Device } from '@ionic-native/device';

import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';

const DATABASE_APEX_NAME: string = 'dataApex.db';
const SERVEUR_APEX_NAME: string = 'http://www.gbrunel.fr/ionic/';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public connected: Subscription;
  public disconnected: Subscription;
  private db: SQLiteObject;
  private dataUser: any[];
  private dataSesion: any[];
  public filter: string = 'date';
  public baseURI: string = SERVEUR_APEX_NAME;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public dateformater: Dateformater,
    private sqlite: SQLite,
    private network: Network,
    public device: Device,
    private http: HTTP,
    public locationTracker: LocationTracker) {

    this.createDatabaseApex();
    this.startGeolocation();
  }

  ionViewWillEnter() {
    if (this.network.type === '4g' || this.network.type === '3g' || this.network.type === 'wifi') {
      this.checkServeUpdate();
    }
  }

  ionViewWillLeave() {}


  public startGeolocation() {
    this.locationTracker.startTracking();
  }

  public stopGeolocation() {
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
    var data = {
      iduser: this.dataUser[0].id
    };
    var apexModal = this.modalCtrl.create('ApexmodalPage', data);
    apexModal.onDidDismiss(() => {
      this.retrieveSession();
    });
    apexModal.present();
  }

  public openSaisieApex() {
    var data = {
      iduser: this.dataUser[0].id
    };
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
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0 )', {})
      .then(() => {
        console.log('User table created');
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `Session`( `idSession` TEXT NOT NULL UNIQUE, `nomParcelle` TEXT, `date` INTEGER NOT NULL, `globalLatitude` REAL, `globalLongitude` REAL, `apexP` INTEGER, `apexR` INTEGER, `apexC` INTEGER, `iac` REAL, `moyenne` REAL, `tauxApexP` REAL, `userId` TEXT NOT NULL, `serve` INTEGER DEFAULT 0, FOREIGN KEY(`userId`) REFERENCES `User`(`idUser`), PRIMARY KEY(`idSession`) )', {})
          .then(() => {
            console.log('Session table created');
            this.db.executeSql('CREATE TABLE IF NOT EXISTS `Observation` ( `idObservation` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE, `apexValue` TEXT NOT NULL, `date` INTEGER NOT NULL, `latitude` REAL NOT NULL, `longitude` REAL NOT NULL, `sessionId` TEXT NOT NULL, `serve`	INTEGER DEFAULT 0, FOREIGN KEY(`sessionId`) REFERENCES `Session`(`idSession`) )', {})
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
            this.openAuthentication();
          }
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public retrieveSession() {
    var filter = this.filter;
    console.log(this.filter);
    var sqlrequest = 'select * from `Session` order by ' + filter + ' desc';
    if (filter == 'nomParcelle') {
      sqlrequest = 'select * from `Session` order by ' + filter + ' asc';
    }

    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
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
              var iac = this.convertInteger(data.rows.item(i).iac);
              var moyenne = data.rows.item(i).moyenne.toFixed(2);
              var tauxApexP = data.rows.item(i).tauxApexP.toFixed(1);
              var affichage = this.computeAffichage(moyenne,tauxApexP,iac);
              console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++');
              console.log(affichage);
              this.dataSesion.push({
                id: data.rows.item(i).idSession,
                nomParcelle: data.rows.item(i).nomParcelle,
                globalLatitude: data.rows.item(i).globalLatitude,
                globalLongitude: data.rows.item(i).globalLongitude,
                apexP: data.rows.item(i).apexP,
                apexR: data.rows.item(i).apexR,
                apexC: data.rows.item(i).apexC,
                moyenne: moyenne,
                tauxApexP: tauxApexP,
                iac: iac,
                date: date,
                time: time,
                affichage:affichage,
                userId: data.rows.item(i).userId
              });
            }
          }
        }
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }

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
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }

  public deleteEntry(id) {
    let confirm = this.alertCtrl.create({
      title: 'Vous voulez supprimer les données de cette parcelle ?',
      //message: 'Do you agree to use this lightsaber to do good across the intergalactic galaxy?',
      buttons: [{
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
            this.retrieveSession();
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  //Delete session
  public deleteSession(id): void {
    var idSession = id;
    this.db.executeSql('DELETE FROM `Session` WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session ' + idSession + ' deleted');
        this.retrieveSession();
      })
      .catch(e => console.log(e));
  }

  //Delete observations
  public deleteObservation(id): void {
    var idSession = id;
    this.db.executeSql('DELETE FROM `Observation` WHERE sessionId = ?', [idSession])
      .then(() => console.log('Observations ' + idSession + ' deleted'))
      .catch(e => console.log(e));
  }

  postEntryToServe(dataOption): void {
    console.log('KEY : ' + dataOption.key);
    let headers: any = {
      'Content-Type': 'application/json'
    };
    let options: any = dataOption;
    let url: any = this.baseURI + 'apiApex.php';

    this.http.setDataSerializer('json');
    this.http.post(url, options, headers)
      .then(data => {
        console.log('Upadte Serve');
        let request = "";
        if (dataOption.key == 'observation') {
          request = 'UPDATE `Observation` SET serve = 1 WHERE idObservation = ' + dataOption.idObservation;
        }
        if (dataOption.key == 'session') {
          request = 'UPDATE `Session` SET serve = 1 WHERE idSession = ' + dataOption.idSession;
        }
        this.db.executeSql(request, {})
          .then(() => console.log('Serve updated'))
          .catch(e => console.log('Serve Fail updated : ' + e));
      })
      .catch(error => console.log('Fail Serve ' + error));
  }

  public addUserServeur() {
    this.db.executeSql('select * from `User` where serve=0', {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            var dataUsersOption: any;
            for (let i = 0; i < data.rows.length; i++) {
              dataUsersOption = {
                key: 'user',
                id: data.rows.item(i).idUser,
                name: data.rows.item(i).name,
                email: data.rows.item(i).email,
                structure: data.rows.item(i).structure
              };
              this.postEntryToServe(dataUsersOption);
            }
          } else {
            return;
          }
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public addObservationServeur() {
    this.db.executeSql('select * from `Observation` where serve=0', {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            let dataObservation: any;
            for (let i = 0; i < data.rows.length; i++) {
              dataObservation = {
                key: 'observation',
                apexValue: data.rows.item(i).apexValue,
                date: data.rows.item(i).date,
                latitude: data.rows.item(i).latitude,
                longitude: data.rows.item(i).longitude,
                sessionId: data.rows.item(i).sessionId,
                idObservation: data.rows.item(i).idObservation
              };
              this.postEntryToServe(dataObservation);
            }
          }
        } else {
          return;
        }
      })
      .catch(e => console.log('fail sql retrieve Observation ' + e));
  }

  public addSessionServeur() {
    this.db.executeSql('select * from `Session` where serve=0', {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            let dataSession: any;
            for (let i = 0; i < data.rows.length; i++) {
              dataSession = {
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
                userId: data.rows.item(i).userId
              };
              this.postEntryToServe(dataSession);
            }
          }
        } else {
          return;
        }
      })
      .catch(e => console.log('fail sql retrieve Session ' + e));
  }

  public checkServeUpdate() {
    this.addUserServeur();
    this.addObservationServeur();
    this.addSessionServeur();
  }

}
