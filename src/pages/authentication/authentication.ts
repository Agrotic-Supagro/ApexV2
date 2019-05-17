import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Device } from '@ionic-native/device';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-authentication',
  templateUrl: 'authentication.html',
})
export class AuthenticationPage {

  private db: SQLiteObject;
  public structure:string;
  public name:string;
  public email:string;
  public isTuto:any = true;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl : ViewController,
    public modalCtrl: ModalController,
    public device: Device,
    public alertCtrl: AlertController,
    private sqlite: SQLite) {
      this.openDB();
      /*this.showAlert('Cette application a été développée dans le cadre de travaux de recherche. '+
      'En l\'utilisant, vous acceptez que les données, une fois anonymisées, puissent être utilisées pour des travaux de recherche. '+
      'L\'application est actuellement en version Béta. N\'hésitez pas à faire remonter des dysfonctionnements que vous pourriez observer.');*/
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AuthenticationPage');
  }

  public openTutoriel() {
    var data = {
      isTuto: true
    };
    var viewData = this.modalCtrl.create('TutorielPage', data);
    viewData.onDidDismiss(() => {
      console.log('toto');
    });
    viewData.present();
  }

  private openDB(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB created !');
        this.db = db;
      })
      .catch(e => console.log(e));
  }

  public saveUser():void{
    console.log(this.structure);
    console.log(this.name);
    console.log(this.email);
    if (this.validateEmail(this.email)) {
      if(this.structure != null && this.name != null && this.email != null){
        this.createDefaultUser();
        var data = { id: this.device.uuid, structure: this.structure, name:this.name, email:this.email };
        this.viewCtrl.dismiss(data);
      }
      else{
        this.showAlert('Merci de renseigner tous les champs');
      }
    }
    else{
      this.showAlert('Merci de renseigner une adresse email correcte');
    }

  }

  public validateEmail(email):boolean {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

  private createDefaultUser(): void {
    var uuidPhone = this.device.uuid;
    var name = this.name;
    var email = this.email;
    var structure = this.structure;
        
    this.db.executeSql('INSERT INTO `User` (idUser, name, email, structure) VALUES(?,?,?,?)', [uuidPhone,name, email, structure])
      .then(() => {
        console.log('User created ! Structure : '+structure+' and Name : '+name);
        this.polpulateDB();
      })
      .catch(e => console.log(e));
  }

  public showAlert(txt):void {
    let alert = this.alertCtrl.create({
      title: 'Apex',
      subTitle: txt,
      buttons: ['OK']
    });
    alert.present();
  }

  public polpulateDB() {
    var nomParcelle = 'Parcelle d\'exemple';
    var userId = this.device.uuid;
    var globalLatitude = 43.6451;
    var globalLongitude = 3.87191;

    var idSession = 'test0001-8a21-0a8d-418f-c155aaaetest';
    var p = 0;
    var r = 0;
    var c = 50;
    var iac = this.computeIAC(p, r, c);
    var moy = this.computeMoyenne(p, r, c);
    var txP = this.computeTx(p, r, c);
    var date = 1535722200;
    this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        [idSession, nomParcelle, date, globalLatitude, globalLongitude, p, r, c, iac, moy, txP, userId])
      .then(() => {
        idSession = 'test0002-8a21-0a8d-418f-c155aaaetest';
        p = 0;
        r = 10;
        c = 40;
        iac = this.computeIAC(p, r, c);
        moy = this.computeMoyenne(p, r, c);
        txP = this.computeTx(p, r, c);
        date = 1534339980;
        this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
            [idSession, nomParcelle, date, globalLatitude, globalLongitude, p, r, c, iac, moy, txP, userId])
          .then(() => {
            idSession = 'test0003-8a21-0a8d-418f-c155aaaetest';
            p = 5;
            r = 30;
            c = 15;
            iac = this.computeIAC(p, r, c);
            moy = this.computeMoyenne(p, r, c);
            txP = this.computeTx(p, r, c);
            date = 1533130200;
            this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                [idSession, nomParcelle, date, globalLatitude, globalLongitude, p, r, c, iac, moy, txP, userId])
              .then(() => {
                idSession = 'test0004-8a21-0a8d-418f-c155aaaetest';
                p = 40;
                r = 10;
                c = 0;
                iac = this.computeIAC(p, r, c);
                moy = this.computeMoyenne(p, r, c);
                txP = this.computeTx(p, r, c);
                date = 1530451800;
                this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                    [idSession, nomParcelle, date, globalLatitude, globalLongitude, p, r, c, iac, moy, txP, userId])
                  .then(() => {
                    idSession = 'test0005-8a21-0a8d-418f-c155aaaetest';
                    p = 50;
                    r = 0;
                    c = 0;
                    iac = this.computeIAC(p, r, c);
                    moy = this.computeMoyenne(p, r, c);
                    txP = this.computeTx(p, r, c);
                    date = 1529069340;
                    this.db.executeSql('INSERT INTO `Session` (idSession, nomParcelle, date, globalLatitude, globalLongitude, apexP, apexR, apexC, iac, moyenne, tauxApexP, userId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
                        [idSession, nomParcelle, date, globalLatitude, globalLongitude, p, r, c, iac, moy, txP, userId])
                      .then(() => {

                      })
                      .catch(e => console.log(e));
                  })
                  .catch(e => console.log(e));
              })
              .catch(e => console.log(e));
          })
          .catch(e => console.log(e));
      })
      .catch(e => console.log(e));
  }

  public computeIAC(p,r,c):any{
    let totalentity = p + r + c;
    let p_purcent = (p * 100 / totalentity)/100;
    let r_purcent = (r * 100 / totalentity)/100;
    let c_purcent = (c * 100 / totalentity)/100;
    let iac = (100/3)*((1-p_purcent)+(r_purcent)+(2*c_purcent))
    console.log('compute iac : '+iac);
    return iac;
  }

  public computeMoyenne(p,r,c):number{
    var apexP:number = +p;
    var apexR:number = +r;
    var apexC:number = +c;
    var moyenne = ((apexP)+(apexR/2))/(apexP+apexR+apexC);
    console.log('compute moyenne : '+moyenne);
    return moyenne;
  }

  public computeTx(p,r,c):number {
    var apexP:number = +p;
    var apexR:number = +r;
    var apexC:number = +c;
    var tauxApexP = apexP/(apexC+apexP+apexR)*100;
    console.log('compute taux Apex P : '+tauxApexP);
    return tauxApexP;
  }
}
