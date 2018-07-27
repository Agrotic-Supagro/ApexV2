import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-edit',
  templateUrl: 'edit.html',
})
export class EditPage {

  private db: SQLiteObject;

  public apexC: number;
  public apexR: number;
  public apexP: number;
  public nomParcelle: string;
  public nomParcelleSave: string;
  public idUser: string;
  public guidsession: string;

  constructor( public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public sqlite: SQLite,
    public navParams: NavParams) {

      this.openDataBase();
      this.idUser = this.navParams.get('iduser');
      this.guidsession = this.navParams.get('idsession');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EditPage');
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
      })
      .catch(e => console.log(e));
  }

  public retrieveSession() {
    this.db.executeSql('select * from `Session` where idSession = ?', [this.guidsession])
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            console.log('Push data session');
            for (let i = 0; i < data.rows.length; i++) {
              this.nomParcelle = data.rows.item(i).nomParcelle;
              this.nomParcelleSave = data.rows.item(i).nomParcelle;
              this.apexP = data.rows.item(i).apexP;
              this.apexP = data.rows.item(i).apexP;
              this.apexR = data.rows.item(i).apexR;
              this.apexC = data.rows.item(i).apexC;
            }
          }
        }
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }

  public updateSession():void{
    var idSession = this.guidsession;
    var nomParcelle = this.nomParcelle;
    var iac = this.computeIAC();
    var moyenne = this.computeMoyenne();
    var tauxApexP = this.computeTx();
    var apexP = this.apexP;
    var apexR = this.apexR;
    var apexC = this.apexC;

    console.log('try update Session table')
 
    this.db.executeSql('UPDATE `Session` SET nomParcelle=?, iac=?, moyenne=?, tauxApexP=?, apexP=?, apexR=?, apexC=? WHERE idSession=?', 
    [nomParcelle, iac, moyenne, tauxApexP, apexP, apexR, apexC, idSession])
    .then(() => console.log('Session updated'))
    .catch(e => console.log(e));

  }

  public computeIAC():any{
    let p:number = +this.apexP;
    let r:number = +this.apexR;
    let c:number = +this.apexC;
    let totalentity = p + r + c;
    let p_purcent = (p * 100 / totalentity)/100;
    let r_purcent = (r * 100 / totalentity)/100;
    let c_purcent = (c * 100 / totalentity)/100;
    let iac = (100/3)*((1-p_purcent)+(r_purcent)+(2*c_purcent))
    console.log('compute iac : '+iac);
    return iac;
  }

  public computeMoyenne():number{
    var apexP:number = +this.apexP;
    var apexR:number = +this.apexR;
    var apexC:number = +this.apexC;
    var moyenne = ((apexP*2)+(apexR))/(apexC+apexP+apexR);
    console.log('compute moyenne : '+moyenne);
    return moyenne;
  }

  public computeTx():number {
    var apexP:number = +this.apexP;
    var apexR:number = +this.apexR;
    var apexC:number = +this.apexC;
    var tauxApexP = apexP/(apexC+apexP+apexR)*100;
    console.log('compute taux Apex P : '+tauxApexP);
    return tauxApexP;
  }

  public closeModal() {
    if(this.apexP == null || this.apexP.toString() == "")this.apexP = 0;
    if(this.apexR == null || this.apexR.toString() == "")this.apexR = 0;
    if(this.apexC == null || this.apexC.toString() == "")this.apexC = 0;
    if(this.nomParcelle == null || this.nomParcelle == ""){
      this.showAlert();
    }
    else{
      this.updateSession();
      this.viewCtrl.dismiss();
    }
  }

  public showAlert() {
    let alert = this.alertCtrl.create({
      title: 'Modifier Parcelle',
      subTitle: 'Merci de donner un nom à votre parcelle',
      buttons: ['OK']
    });
    alert.present();
  }
}
