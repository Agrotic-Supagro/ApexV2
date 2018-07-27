import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Dateformater } from '../../services/dateformater.service';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-viewdata',
  templateUrl: 'viewdata.html',
})
export class ViewdataPage {

  private db: SQLiteObject;


  public idUser: string;
  public guidsession: string;
  public dataSession;

  constructor( public navCtrl: NavController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public sqlite: SQLite,
    public dateformater: Dateformater,
    public navParams: NavParams) {

      this.openDataBase();
      this.idUser = this.navParams.get('iduser');
      this.guidsession = this.navParams.get('idsession');
      this.dataSession='';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad View Data');
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
            for (let i = 0; i < data.rows.length; i++) {
              var date = this.dateformater.convertToDate(data.rows.item(i).date);
              var time = this.dateformater.convertToTime(data.rows.item(i).date);
              var iac = this.convertInteger(data.rows.item(i).iac);
              var moyenne = data.rows.item(i).moyenne.toFixed(2);
              var tauxApexP = data.rows.item(i).tauxApexP.toFixed(1);
              var affichage = this.computeAffichage(moyenne,tauxApexP,iac);
              this.dataSession = {
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
                affichage:affichage
              };
            }
          }
        }
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }
  public convertInteger(x) {
    return Number.parseInt(x);
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
  
  public closeModal() {
      this.viewCtrl.dismiss();
  }
}