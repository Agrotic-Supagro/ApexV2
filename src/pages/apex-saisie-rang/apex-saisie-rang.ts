import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';

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
  public idUser: string;
  public numeroSession: number;
  public nomParcelle: string;
  public latitude: number;
  public longitude: number;
  public selectParcelle: any[];

  constructor(
    public vibration: Vibration,
    public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public sqlite: SQLite,
    public navParams: NavParams,
    public locationTracker: LocationTracker,
    public dateformater: Dateformater,
    public guid: GUIDGenerator) {

      console.log('try open DB');
      this.selectParcelle = [];
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
    this.latitude = this.locationTracker.getLatitude();
    this.longitude = this.locationTracker.getLongitude();
    
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
        this.retrieveNomParcelle();
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

  async saveSession(){
    var idSession = this.guidsession;
    var nomParcelle = 'Session N°' + this.numeroSession;
    if (this.nomParcelle != null) {
      nomParcelle = this.nomParcelle; 
    } 
    var date = this.dateformater.gettimestamp();
    var globalLatitude = this.latitude;
    var globalLongitude = this.longitude;
    var apexP = this.p_array;
    var apexR = this.r_array;
    var apexC = this.c_array;
    var iac = this.computeIAC();
    var moyenne = this.computeMoyenne();
    var tauxApexP = this.computeTx();
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
    if(this.p_array == null)this.p_array = 0;
    if(this.c_array == null)this.c_array = 0;
    if(this.r_array == null)this.r_array = 0;

    if(this.p_array == 0 && this.r_array == 0 && this.c_array == 0){
      this.viewCtrl.dismiss();
    }
    else{
      this.saveSession().then(() => {
        this.showResult();
      })
      .catch();
      this.viewCtrl.dismiss();
    }
  }

  showResult() {
    var iac = this.convertInteger(this.computeIAC());
    var moyenne = this.computeMoyenne().toFixed(2);
    var tauxApexP = this.computeTx().toFixed(2);
    let alert = this.alertCtrl.create({
      title: 'IAC : '+iac,
      subTitle: 'Moyenne : '+moyenne+' <br/> Taux Apex P : '+tauxApexP,
      buttons: ['OK']
    });
    alert.present();
  }
  public convertInteger(x) {
    //return Number.parseFloat(x).toFixed(2);
    return Number.parseInt(x);
  }

  //Controle liste déroulante + ajout
  public retrieveNomParcelle() {
    this.db.executeSql('select distinct nomParcelle from `Session` where serve=0 or serve=1 order by nomParcelle asc', {})
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
            if (data.nomparcelle == '' || data.nomparcelle.length === 0 || /^\s*$/.test(data.nomparcelle)) {
              this.nomParcelle = null;
            } else {
              this.selectParcelle.push({nom:data.nomparcelle, check:true});
              this.nomParcelle = data.nomparcelle;
            }
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
