import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, Platform } from 'ionic-angular';
import { EmailComposer } from '@ionic-native/email-composer';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { File } from '@ionic-native/file';
import { Dateformater } from '../../services/dateformater.service';

const DATABASE_APEX_NAME: string = 'dataApex.db';
const DIR_APEX_NAME: string = 'ApexData';

@IonicPage()
@Component({
  selector: 'page-compte',
  templateUrl: 'compte.html',
})
export class ComptePage {

  private db: SQLiteObject;
  public name: any;
  public email: any;
  public structure: any;
  public model: any;
  public idUser:any;

  public filename: string;

  public isEdit:boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private sqlite: SQLite,
    public file: File,
    public alertCtrl : AlertController,
    public toastCtrl: ToastController,
    public platform: Platform,
    public dateformater: Dateformater,
    private emailComposer: EmailComposer) {
      this.filename = 'ApexData.csv';
      this.platform.ready().then(() =>{
        //this.writeFile('teote');
        this.openDataBase();
      });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ComptePage');
  }

  private openDataBase(): void {
    this.sqlite.create({
        name: DATABASE_APEX_NAME,
        location: 'default'
      })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
        this.getUser();
        this.writeData();
        //this.writeDir();
      })
      .catch(e => console.log(e));
  }

  public getUser() {
    this.db.executeSql('select * from `User`', {})
      .then((data) => {
        if (data == null) {
          return;
        }
        if (data.rows) {
          if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
              this.idUser = data.rows.item(i).idUser,
              this.name = data.rows.item(i).name;
              this.email = data.rows.item(i).email;
              this.structure = data.rows.item(i).structure;
              this.model = data.rows.item(i).model;
            }
            console.log('idUser : ' + this.name);
          } 
        }

      })
      .catch(e => console.log('fail sql retrieve User ' + e));
  }

  public writeData() {

    var sqlrequest = 'select * from `Session`';
    var alldata = 'Parcelle;Date;Heure;Latitude;Longitude;Apex pleine croissance;Apex croissante ralentie;Apex croissance arretee;Indice de croissance;% Apex pleine croissance;% Apex croissance ralentie;% Apex croissance arretee';
    console.log('Write CSV Data');
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

              if (data.rows.item(i).apexR == 999) {
                alldata = alldata + '\n' +
                  data.rows.item(i).nomParcelle + ';' +
                  date + ';' +
                  time + ';' +
                  data.rows.item(i).globalLatitude + ';' +
                  data.rows.item(i).globalLongitude + ';' +
                  'ecimee';
              } else {
                var apexR = data.rows.item(i).apexR;
                var apexC = data.rows.item(i).apexC;
                var apexP = data.rows.item(i).apexP;
                tauxApexP = apexP / (apexC + apexP + apexR) * 100;
                tauxApexR = apexR / (apexC + apexP + apexR) * 100;
                tauxApexC = apexC / (apexC + apexP + apexR) * 100;
                var tauxApexR: any;
                var tauxApexC: any;
                var tauxApexP: any;
                alldata = alldata + '\n' +
                  //data.rows.item(i).idSession + ';' +
                  data.rows.item(i).nomParcelle + ';' +
                  date + ';' +
                  time + ';' +
                  data.rows.item(i).globalLatitude + ';' +
                  data.rows.item(i).globalLongitude + ';' +
                  data.rows.item(i).apexP + ';' +
                  data.rows.item(i).apexR + ';' +
                  data.rows.item(i).apexC + ';' +
                  data.rows.item(i).moyenne + ';' +
                  tauxApexP + ';' +
                  tauxApexR + ';' +
                  tauxApexC;
              }
            }
          }
        }
        this.writeDir(alldata);
      }).then(() => {})
      .catch(e => console.log('fail write CSV file : ' + e));
  }

  writeDir(alldata){
    var dirName = DIR_APEX_NAME;
    if(this.platform.is('android')) {
      this.file.checkDir(this.file.externalRootDirectory, dirName).then(response => {
        console.log('Directory exists'+response);
        this.writeFile(alldata);
      }).catch(err => {
        console.log('Directory doesn\'t exist'+JSON.stringify(err));
        this.file.createDir(this.file.externalRootDirectory, dirName, false).then(response => {
          console.log('Directory create'+response);
          this.writeFile(alldata);
        }).catch(err => {
          console.log('Directory no create'+JSON.stringify(err));
        }); 
      });
    }
  }

  writeFile(alldata){
    console.log(this.filename);
    var dirName = DIR_APEX_NAME;
    this.file.writeFile(this.file.externalRootDirectory + dirName, this.filename, alldata, {
      replace: true
    });
  }

  sendEmail(): void {
    var dirName = DIR_APEX_NAME;
      let email = {
        to: this.email,
        cc: 'agrotic.applications@gmail.com',
        attachments: [
          this.file.externalRootDirectory + '/' +dirName+ '/' + this.filename
        ],
        subject: '[ApeX] Contact',
        body: 'Vos données de l\'application Apex au format CSV.',
        isHtml: true
      };
      this.emailComposer.open(email).then(()=>{

      });
  }

  presentToast(e) {
    let toast = this.toastCtrl.create({
      message: e,
      duration: 2000,
      position: 'top'
    });
  
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
  
    toast.present();
  }

  ifv(e){
    this.model = e;
    this.db.executeSql('UPDATE `User` SET model = ? WHERE idUser = ?', [this.model, this.idUser])
      .then(() => {
        if (e == 1) {
          this.presentToast('Modèle IFV activé !')
        } else {
          this.presentToast('Modèle IFV désactivé !')
        }
        console.log('IFV model : ' + this.model);
      })
      .catch(e => console.log(e));
      
  }

  editInfo(){
    this.isEdit = true;
  }
  annulateInfo(){
    this.isEdit = false;
  }
  validateInfo(){
    this.isEdit = false;
    if (this.validateEmail(this.email)) {
      if(this.structure != null && this.name != null && this.email != null){
        this.updateUser();
      }
      else{
        this.showAlert('Merci de renseigner tous les champs');
      }
    }
    else{
      this.showAlert('Merci de renseigner une adresse email correcte');
    }
  }

  updateUser() {
    this.db.executeSql('UPDATE `User` SET name = ?, email = ?, structure = ?, serve = 0 WHERE idUser = ?', [this.name, this.email, this.structure, this.idUser])
    .then(() => {
        this.presentToast('Données personnelles éditées')
      console.log('UPDATE USER !');
    })
    .catch(e => console.log(e));
  }

  public validateEmail(email):boolean {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  public showAlert(txt):void {
    let alert = this.alertCtrl.create({
      title: 'Apex',
      subTitle: txt,
      buttons: ['OK']
    });
    alert.present();
  }
}
