import { Component } from '@angular/core';
import { NavController, AlertController, Platform, Nav, App, IonicApp } from 'ionic-angular';
import { ModalController } from 'ionic-angular';
import { Subscription} from 'rxjs/Subscription';

import { LocationTracker } from '../../services/locationtracker.service';
import { Dateformater } from '../../services/dateformater.service';
import { ApexData } from '../../services/apexdata.service';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';
import { File } from '@ionic-native/file';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

const DATABASE_APEX_NAME: string = 'dataApex.db';
/* configuration pour la version release OLD*/
//const SERVEUR_APEX_NAME: string = 'https://www.gbrunel.fr/ionic/';
//const SERVEUR_APEX_FILE: string = 'apiApexv3.php';

const SERVEUR_APEX_NAME: string = 'https://www.agrotic.org/apex/';
const SERVEUR_APEX_FILE: string = 'apiApex.php';

import { Chart } from 'chart.js';


/* Configuration pour les tests */
//const SERVEUR_APEX_NAME: string = 'https://www.gbrunel.fr/ionic/dev/';
//const SERVEUR_APEX_FILE: string = 'apiApexv3_dev.php';

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
  private dataChart: any[];
  public baseURI: string = SERVEUR_APEX_NAME;
  public testArray = [];
  public doughnutChartLabels:string[] = ['Apex 2', 'Apex 1', 'Apex 0'];
  public isToggled: boolean;
  public filter: string = 'date';
  public ifv:number;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public dateformater: Dateformater,
    private sqlite: SQLite,
    private network: Network,
    public device: Device,
    private http: HTTP,
    public file: File,
    private ionicApp: IonicApp,
    public platform: Platform,
    public nav: Nav,
    public app: App,
    public apexData: ApexData,
    public locationAccuracy: LocationAccuracy,
    public locationTracker: LocationTracker) {

      platform.registerBackButtonAction(() => {
        if (navCtrl.canGoBack()) { // CHECK IF THE USER IS IN THE ROOT PAGE.
          navCtrl.pop(); // IF IT'S NOT THE ROOT, POP A PAGE.
        } else {
          
          let nav = app.getActiveNavs()[0];
          let activeView = nav.getActive();
          if (activeView.name === 'HomePage') {
            this.exitApplication();
          } else {
            let activeModal=this.ionicApp._modalPortal.getActive();
            if(activeModal){
              activeModal.dismiss();
                  return;
              }
          }
          
        }
      });

    this.createDatabaseApex();
    this.startGeolocation();

  }
  ionViewDidLoad() {}
  ionViewDidEnter() { this.modelIVF();}
  ionViewWillLeave() {}

  public modelIVF() {
    this.db.executeSql('select * from `User` order by idUser desc', {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              this.ifv = data.rows.item(i).model;
            }
            console.log('Model IFV : ' + this.ifv);
          } 
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public exitApplication() {
    let confirm = this.alertCtrl.create({
      title: 'Fermer l\'application ?',
      //message: 'Do you agree to use this lightsaber to do good across the intergalactic galaxy?',
      buttons: [{
          text: 'Non',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Oui',
          handler: () => {
            this.platform.exitApp(); // IF IT'S THE ROOT, EXIT THE APP.
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  public startGeolocation() {
    this.locationTracker.startTracking();
  }

  public stopGeolocation() {
    this.locationTracker.stopTracking();
  }

  public openAuthentication() {
    var authenticationModal = this.modalCtrl.create('AuthenticationPage');
    authenticationModal.onDidDismiss((data) => {
      this.dataUser = data;
      this.retrieveUser();
      this.checkServeUpdate();
     
    });
    authenticationModal.present();
  }

  public openModal() {
    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
      () => {
        var data = {
          iduser: this.dataUser[0].id
        };
        var apexModal = this.modalCtrl.create('ApexmodalPage', data);
        apexModal.onDidDismiss(() => {
          this.retrieveSession();
          this.getDataForChart();
          this.checkServeUpdate();
        });
        apexModal.present();
      },
      error => alert('L\'application ne peut pas fonctionner sans GPS')
    );
  }

  public openSaisieApex() {
    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
      () => {
        var data = {
          iduser: this.dataUser[0].id
        };
        var apexSaisie = this.modalCtrl.create('ApexSaisieRangPage', data);
        apexSaisie.onDidDismiss(() => {
          this.retrieveSession();
          this.getDataForChart();
          this.checkServeUpdate();
        });
        apexSaisie.present();
      },
      error => alert('L\'application ne peut pas fonctionner sans GPS')
    );
  }

  public openViewSession(nomParcelleView) {
    var data = {
      iduser: this.dataUser[0].id,
      nomParcelleView: nomParcelleView,
      ifv:this.ifv
    };
    var viewData = this.modalCtrl.create('ViewdataPage', data);
    viewData.onDidDismiss(() => {
      this.retrieveSession();
      this.getDataForChart();
      this.checkServeUpdate();
    });
    viewData.present();
  }

  public openEditSession(idsessionUpdate) {
    var data = {
      iduser: this.dataUser[0].id,
      idsession: idsessionUpdate
    };
    var editSaisie = this.modalCtrl.create('EditPage', data);
    editSaisie.onDidDismiss(() => {
      this.retrieveSession();
      this.getDataForChart();
      this.checkServeUpdate();
    });
    editSaisie.present();
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
    this.db.executeSql('CREATE TABLE IF NOT EXISTS `User` ( `idUser` TEXT NOT NULL PRIMARY KEY UNIQUE, `name` TEXT, `email` TEXT, `structure` TEXT, `serve` INTEGER DEFAULT 0, `model` INTEGER DEFAULT 1 )', {})
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
                this.getDataForChart();
                this.checkServeUpdate();
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
              this.ifv = data.rows.item(i).model;
              this.dataUser.push({
                id: data.rows.item(i).idUser,
                name: data.rows.item(i).name,
                email: data.rows.item(i).email,
                structure: data.rows.item(i).structure
              });
            }
            console.log('idUser : ' + this.dataUser[0].id);
          } else {
            if (this.dataUser == null) {
              this.openAuthentication();
            }
            
          }
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public changeFilter(){
    console.log('Filter : '+this.filter);
    if (this.filter == 'nomParcelle') {
      this.dataSesion.sort(function (a, b) {
        return a.nomParcelle.localeCompare(b.nomParcelle);
      });
    } else {
      this.dataSesion.sort(function (a, b) {
        return b.timestamp - a.timestamp;
      });
    }
  }

  public retrieveSession() {
    var sqlrequest = 'select distinct `nomParcelle` from `Session`';
    //var sqlrequest = 'select * from `Session` where serve=0 or serve=1 order by date desc LIMIT 20';
    this.dataSesion = [];

    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              console.log(data.rows.item(i).nomParcelle);
              this.db.executeSql('select * from `Session` WHERE nomParcelle = ? order by date desc LIMIT 2', [data.rows.item(i).nomParcelle])
                .then((data) => {
                  if (data == null) {
                    console.log('no session yet');
                    return;
                  }
                  if (data.rows) {
                    if (data.rows.length > 0) {
                      // DEFINITION DES VARIABLES
                      var fleche = 'assets/imgs/f0.jpg';
                      var classe = 'forte';
                      var apexP= data.rows.item(0).apexP;
                      var apexR= data.rows.item(0).apexR;
                      var apexC= data.rows.item(0).apexC;
                      var moyenne = ((apexP)+(apexR/2))/(apexP+apexR+apexC);
                      var tauxApexP = data.rows.item(0).tauxApexP;
                      var tauxApexC = apexC/(apexC+apexP+apexR)*100;
                      var visibility:boolean = true;

                      if (apexP == 999) {
                        visibility = false;
                        classe = 'none';
                      } else {
                        // GESTION DES CLASSES
                        if (moyenne >= 0.75) {
                          classe = 'absente';
                        } else {
                          if (tauxApexP >= 5) {
                            classe = 'moderee';
                          } else {
                            if (tauxApexC <= 90) {
                              classe = 'importante';
                            }
                          }
                        }
                        // GESTION DE LA DYNAMIQUE
                        if (data.rows.length == 2) {
                          fleche = 'assets/imgs/f2.jpg';
                          var apexPOld= data.rows.item(1).apexP;
                          var apexROld= data.rows.item(1).apexR;
                          var apexCOld= data.rows.item(1).apexC;
                          var moyenneOld = ((apexPOld)+(apexROld/2))/(apexPOld+apexROld+apexCOld);
                          var diffMoyenne = moyenneOld-moyenne;
                          if (diffMoyenne > 0.2) {
                            fleche = 'assets/imgs/f3.jpg';
                          } else {
                            if(diffMoyenne < -0.2) fleche = 'assets/imgs/f1.jpg';
                          }
                        }
                      }


                      this.dataSesion.push({
                        id: data.rows.item(0).idSession,
                        nomParcelle: data.rows.item(0).nomParcelle,
                        apexP: data.rows.item(0).apexP,
                        apexR: data.rows.item(0).apexR,
                        apexC: data.rows.item(0).apexC,
                        visibility: visibility,
                        fleche: fleche,
                        classe:classe,
                        date: this.dateformater.convertToDate(data.rows.item(0).date),
                        time: this.dateformater.convertToTime(data.rows.item(0).date),
                        timestamp: data.rows.item(0).date,
                        userId: data.rows.item(0).userId
                      });
                      this.dataSesion.sort(function (a, b) {
                        return b.timestamp - a.timestamp;
                      });
                    }
                  }
                })
                .catch(e => console.log('fail sql retrieve Sessions ' + e));
            }
          }
        }
      })
      .catch(e => console.log('fail Open DB ' + e));
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
            this.hiddenSession(id);
            this.retrieveSession();
            this.getDataForChart();
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  //Hidde session - Rend invisible la session à l'utilisation mais ne la supprime pas de la base
  public hiddenSession(id): void {
    var idSession = id;
    this.db.executeSql('UPDATE `Session` SET serve = 2 WHERE idSession = ?', [idSession])
      .then(() => {
        console.log('Session ' + idSession + ' hidden');
        this.dataSesion = [];
        this.retrieveSession();
        this.getDataForChart();
      })
      .catch(e => console.log(e));
  }

  //Delete session
  public deleteSession(id):void{
    var idSession = id
    this.db.executeSql('DELETE FROM `Session` WHERE idSession = ?', [idSession])
    .then(() => console.log('Session '+idSession+' deleted'))
    .catch(e => console.log(e));
  }

  //Delete observations
  public deleteObservation(id):void{
    var idSession = id;
    this.db.executeSql('DELETE FROM `Observation` WHERE sessionId = ?', [idSession])
    .then(() => console.log('Observations '+idSession+' deleted'))
    .catch(e => console.log(e));
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
    this.db.executeSql('select * from `Session` where serve=0 or serve=2', {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            let dataSession: any;
            console.log(this.dataUser[0].structure);
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
                serve:data.rows.item(i).serve,
                userId: data.rows.item(i).userId,
                structure:this.dataUser[0].structure
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

  async postEntryToServe(dataOption){
    console.log('KEY : ' + dataOption.key);
    let headers: any = {
      'Content-Type': 'application/json'
    };
    let options: any = dataOption;
    let url: any = this.baseURI + SERVEUR_APEX_FILE;

    this.http.setDataSerializer('json');
    this.http.post(url, options, headers)
      .then(data => {
        console.log('Upadte Serve');
        let request = '';
        let option = ''
        if (dataOption.key == 'observation') {
          request = 'UPDATE `Observation` SET serve = 1 WHERE idObservation = ?';
          option = dataOption.idObservation;
        }
        else if (dataOption.key == 'session') {
          option = dataOption.idSession;
          if (dataOption.serve == 0) {
            request = 'UPDATE `Session` SET serve = 1 WHERE idSession = ?';
          } else {
            request = 'UPDATE `Session` SET serve = 3 WHERE idSession = ?';
          }
          
        } else {
          request = 'UPDATE `User` SET serve = 1 WHERE idUser = ?';
          option = dataOption.id;
        }
        this.db.executeSql(request, [option])
          .then(() => console.log('Serve updated'))
          .catch(e => console.log('key '+dataOption.key+' Serve Fail updated : ' + e));
      })
      .catch(error => console.log('Fail Serve ' + error));
  }

  public checkServeUpdate() {
    if (this.network.type === '4g' || this.network.type === '3g' || this.network.type === 'wifi') {
    this.addObservationServeur();
    this.addUserServeur();
    this.addSessionServeur();
    }
    else{
      console.log("No Network "+ this.network.type);
    }
  }

  public writeData(){
    var filename = this.dateformater.getdate()+'_apexData.csv';
    var sqlrequest = 'select * from `Session`';
    var alldata='id;Parcelle;Date;Heure;Latitude;Longitude;ApexP;ApexR;apexC;IAC;Moyenne;TauxApexP';

    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              var date = this.dateformater.convertToDate(data.rows.item(i).date);
              var time = this.dateformater.convertToTime(data.rows.item(i).date);
              alldata = alldata+'\n'+
                data.rows.item(i).idSession+';'+
                data.rows.item(i).nomParcelle+';'+
                date+';'+
                time+';'+
                data.rows.item(i).globalLatitude+';'+
                data.rows.item(i).globalLongitude+';'+
                data.rows.item(i).apexP+';'+
                data.rows.item(i).apexR+';'+
                data.rows.item(i).apexC+';'+
                data.rows.item(i).iac+';'+
                data.rows.item(i).moyenne+';'+
                data.rows.item(i).tauxApexP;
            }
          }
        }
      })
      .catch(e => console.log('fail write CSV file : ' + e));

    this.file.createDir(this.file.externalRootDirectory, 'apex', true).then(data => {
      this.file.writeFile(this.file.externalRootDirectory+'/apex',filename, alldata, {replace: true});
    });

  }
  
  public testconsole(){
    console.log('## TEST ##');
  }

  makeChart(data) {
    console.log('>> '+data.nomParcelle);
    var ctx = (<any>document.getElementById(data.nomParcelle)).getContext('2d');
    new Chart(ctx, {
        // The type of chart we want to create
        type: 'pie',
        // The data for our dataset
        data: {
            labels: ["% Pleine croissance", "% Croissance ralentie", "% Croissance arrétée"],
            datasets: [{
              label: "My First dataset",
              backgroundColor: [
                '#2C6109',               
                '#6E9624',
                '#C5DC68'
              ],
              borderColor: [
                'rgba(255, 255, 255, 1)',
                'rgba(255, 255, 255, 1)',
                'rgba(255, 255, 255, 1)'
              ],
              data: [data.apexP,data.apexR,data.apexC],
              borderWidth: 1
            }]
       },
       options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'left',
          onClick: (e) => e.stopPropagation()
        }
    }
    });
  }

  computeChart(data){
    data.forEach(element => {
      this.makeChart(element);
    });
  }
  public getDataForChart() {
    var sqlrequest = 'select distinct `nomParcelle` from `Session`';
    //var sqlrequest = 'select * from `Session` where serve=0 or serve=1 order by date desc LIMIT 20';
    this.dataChart = [];

    this.db.executeSql(sqlrequest, {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              console.log('## '+data.rows.item(i).nomParcelle);
              this.db.executeSql('select * from `Session` WHERE nomParcelle = ? order by date desc LIMIT 2', [data.rows.item(i).nomParcelle])
                .then((dataforchart) => {
                  if (dataforchart == null) {
                    console.log('no session yet');
                    return;
                  }
                  if (dataforchart.rows) {
                    if (dataforchart.rows.length > 0) {
                      if (dataforchart.rows.item(0).apexP != 999) {
                        var apexP:number= dataforchart.rows.item(0).apexP;
                        var apexR:number= dataforchart.rows.item(0).apexR;
                        var apexC:number= dataforchart.rows.item(0).apexC;
                        var tauxApexP:number = apexP/(apexC+apexP+apexR)*100;
                        var tauxApexR:number = apexR/(apexC+apexP+apexR)*100;
                        var tauxApexC:number = apexC/(apexC+apexP+apexR)*100;
                        this.dataChart.push({
                          id: dataforchart.rows.item(0).idSession,
                          nomParcelle: dataforchart.rows.item(0).nomParcelle,
                          apexP: tauxApexP.toFixed(1),
                          apexR: tauxApexR.toFixed(1),
                          apexC: tauxApexC.toFixed(1),
                          userId: dataforchart.rows.item(0).userId
                        });
                        this.computeChart(this.dataChart);
                      }

                    }
                  }
                })
                .catch(e => console.log('fail sql retrieve Sessions for DataChart ' + e));
            }
          }
        }
      })
      .catch(e => console.log('fail Open DB DataChart ' + e));
  }
}
