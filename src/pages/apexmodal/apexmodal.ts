import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';

import { Vibration } from '@ionic-native/vibration';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Keyboard } from '@ionic-native/keyboard';

import { LocationTracker } from '../../services/locationtracker.service';
import { GUIDGenerator } from '../../services/guidgenerator.service';
import { Dateformater } from '../../services/dateformater.service';

const THRESHOLD_APEX: number = 5;
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
  public idUser: string;
  public nomParcelle: string;
  public numeroSession: number;
  public tableLat = [];
  public tableLng = [];
  private leavemodal: boolean = false;
  public selectParcelle: any[];

  constructor(
    public vibration: Vibration,
    public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public sqlite: SQLite,
    public keyboard: Keyboard,
    public navParams: NavParams,
    public locationTracker: LocationTracker,
    public dateformater: Dateformater,
    public guid: GUIDGenerator) {

      this.selectParcelle = [];
      this.keyboard.hideKeyboardAccessoryBar(true);
      this.initializeVariable();
      console.log(this.navParams.get('iduser'));
      this.idUser = this.navParams.get('iduser');
      console.log('try open DB');
      this.openDataBase();
    }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ApexmodalPage');
  }

  private initializeVariable():void{
    this.c_array = 0;
    this.r_array = 0;
    this.p_array = 0;
    this.numberApex = 0;
    this.guidsession = this.guid.getGuid();
    console.log('GUID Session : '+this.guid.getGuid());
  }

  public handleLogin():void{
    this.keyboard.close();
  }

  private openDataBase(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
        this.retrieveSession();
        this.createSession();
        this.getNextIndexSession();
      })
      .catch(e => console.log(e));
  }

  public apexAlert() {
    let alert = this.alertCtrl.create({
      title: 'Méthode des Apex',
      subTitle: 'Pour calculer l\'Indice d\'Arrêt de Croissance (IAC), il est nécessaire de réaliser des observations sur au moins '+this.thresholdApex+' apex. Vous n\'avez réalisé pour l\'instant que '+this.numberApex+' observations.',
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
    this.tableLat.push(lat);
    this.tableLng.push(lng);
    var timestamp = this.dateformater.gettimestamp();
    var apex = apexvalue; 
    var sessionId = this.guidsession;
    console.log('GUID Session : '+ this.guidsession);
    console.log('GUID Session 2 : '+ sessionId);
    this.db.executeSql('INSERT INTO `Observation` (apexValue, date, latitude, longitude, sessionId) VALUES(?,?,?,?,?)',
     [apex,timestamp,lat,lng,sessionId])
      .then(() => console.log('insert observation OK'))
      .catch(e => console.log('fail insert observation : '+e));
  }

  public updateSession():void{
    var idSession = this.guidsession;
    var nomParcelle = 'Session N°' + this.numeroSession;
    if (this.nomParcelle != null) {
      nomParcelle = this.nomParcelle; 
    } 

    var iac = this.computeIAC();
    var geolocation = this.computeGlobalLocation().lat;
    var globalLatitude = geolocation.lat;
    var globalLongitude = geolocation.lng;
    var moyenne = this.computeMoyenne();
    var tauxApexP = this.computeTx();
    var apexP = this.p_array;
    var apexR = this.r_array;
    var apexC = this.c_array;

    console.log('try update Session table')
 
    this.db.executeSql('UPDATE `Session` SET nomParcelle=?, iac=?, moyenne=?, tauxApexP=?, globalLatitude=?, globalLongitude=?, apexP=?, apexR=?, apexC=?  WHERE idSession=?', 
    [nomParcelle, iac, moyenne, tauxApexP, globalLatitude, globalLongitude, apexP, apexR, apexC, idSession])
    .then(() => console.log('Score updated'))
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
          this.numeroSession = data.rows.item(0).rowcount;
        }
      }
    })
    .catch(e => console.log('fail sql retrieve Sessions '+ e));
  }

  public createSession():void{
    var idSession = this.guidsession;
    var nomParcelle = ""; 
    var date = this.dateformater.gettimestamp();
    var globalLatitude = 0;
    var globalLongitude = 0;
    var apexP = 0;
    var apexR = 0;
    var apexC = 0;
    var iac = 0;
    var moyenne = 0;
    var tauxApexP = 0;
    var userId = this.idUser;

    console.log('GUID Session : '+ idSession);
    console.log('Name Session : '+ nomParcelle);
    console.log('Date Session : '+ date);
    console.log('userId Session : '+ userId);

    this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
     [idSession,nomParcelle,date,globalLatitude,globalLongitude,apexP,apexR,apexC,iac,moyenne,tauxApexP,userId])
      .then(() => console.log('insert session OK'))
      .catch(e => console.log('fail insert session : '+e));
  }

  public computeIAC():any{
    let p:number = +this.p_array;
    let r:number = +this.r_array;
    let c:number = +this.c_array;
    let totalentity = p + r + c;
    let p_purcent = (p * 100 / totalentity)/100;
    let r_purcent = (r * 100 / totalentity)/100;
    let c_purcent = (c * 100 / totalentity)/100;
    let iac = (100/3)*((1-p_purcent)+(r_purcent)+(2*c_purcent))
    console.log('compute iac : '+iac);
    return iac;
  }

  public computeGlobalLocation(): any {
    var countLat = this.tableLat.length;
    var countLng = this.tableLng.length;
    var latTemp:number = 0;
    var lngTemp:number = 0;

    this.tableLat.forEach(element => {
      latTemp+=element;
    });

    this.tableLng.forEach(element => {
      lngTemp+=element;
    });

    var lat = latTemp/countLat;
    var lng = lngTemp/countLng;
    var globalGeolocation = {
      lat:lat,
      lng:lng
    };
    console.log('Globale Geolocation - Lat : '+globalGeolocation.lat+' Lng : '+globalGeolocation.lng)
    return globalGeolocation;
  }

  public computeMoyenne():number{
    var apexP:number = +this.p_array;
    var apexR:number = +this.r_array;
    var apexC:number = +this.c_array;
    var moyenne = ((apexP*2)+(apexR))/(apexC+apexP+apexR);
    console.log('compute moyenne : '+moyenne);
    return moyenne;
  }

  public computeTx():number {
    var apexP:number = +this.p_array;
    var apexR:number = +this.r_array;
    var apexC:number = +this.c_array;
    var tauxApexP = apexP/(apexC+apexP+apexR)*100;
    console.log('compute taux Apex P : '+tauxApexP);
    return tauxApexP;
  }

  public closeModal(){
    this.updateSession();
    this.showResult();
    this.leavemodal = true;
    this.viewCtrl.dismiss();
  }
  showResult() {
    var iac = this.convertInteger(this.computeIAC());
    let alert = this.alertCtrl.create({
      title: 'IAC : '+iac,
      //subTitle: 'Your friend, Obi wan Kenobi, just accepted your friend request!',
      buttons: ['OK']
    });
    alert.present();
  }
  public convertInteger(x) {
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }


  ionViewCanLeave(): boolean{
    let totalentity = this.p_array + this.r_array + this.c_array;
    if(totalentity > this.thresholdApex || this.leavemodal){
      console.log('Ok to leave');
      if (this.leavemodal) {
        return true;
      } else {
        this.closeModal();
      }
        
     } else {
       this.showConfirm();
       return false;
     }
   }


   showConfirm() {
    let confirm = this.alertCtrl.create({
      title: 'Quitter la saisie en parcelle ?',
      message: 'Vous n\'avez pas atteint les '+this.thresholdApex+' observations. <br/><br/>En cliquant sur OUI les données ne seront pas sauvegardés.',
      buttons: [
        {
          text: 'Non',
          handler: () => {
            console.log('Disagree clicked -  Continue session');
          }
        },
        {
          text: 'Oui',
          handler: () => {
            console.log('Agree clicked - Close Modal, Unsave session and Observation');
            this.leavemodal = true;
            this.deleteObservation();
            this.deleteSession();
            this.viewCtrl.dismiss();

          }
        }
      ]
    });
    confirm.present();
  }

  //Delete session
  public deleteSession():void{
    var idSession = this.guidsession;
    this.db.executeSql('DELETE FROM `Session` WHERE idSession = ?', [idSession])
    .then(() => console.log('Session '+idSession+' deleted'))
    .catch(e => console.log(e));
  }

  //Delete observations
  public deleteObservation():void{
    var idSession = this.guidsession;
    this.db.executeSql('DELETE FROM `Observation` WHERE sessionId = ?', [idSession])
    .then(() => console.log('Observations '+idSession+' deleted'))
    .catch(e => console.log(e));
  }


  //Controle liste déroulante + ajout
  public retrieveSession() {
    this.db.executeSql('select distinct nomParcelle from `Session` order by nomParcelle asc', {})
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            console.log('Push data session');
            for (let i = 0; i < data.rows.length; i++) {
              this.selectParcelle.push({
                nom: data.rows.item(i).nomParcelle,
                check:false
              });
            }
          }
        }
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }

  public addParcelle() {
    let alert = this.alertCtrl.create({
      title: 'Nouvelle parcelle',
      inputs: [{
        name: 'nomparcelle',
        placeholder: 'nom de la parelle'
      }],
      buttons: [{
          text: 'Annuler',
          role: 'Annuler',
          handler: data => {
            this.nomParcelle = null;
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Ajouter',
          handler: data => {
            this.selectParcelle.push({nom:data.nomparcelle, check:true});
            this.nomParcelle = data.nomparcelle;
          }
        }
      ]
    });
    alert.present();
  }

  public onCancel(){
    this.nomParcelle = null;
  }
}
