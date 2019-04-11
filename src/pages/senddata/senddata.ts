import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { EmailComposer } from '@ionic-native/email-composer';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { File } from '@ionic-native/file';
import { Dateformater } from '../../services/dateformater.service';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-senddata',
  templateUrl: 'senddata.html',
})
export class SenddataPage {

  public emailtext:string;
  public filename:string;
  private db: SQLiteObject;

  constructor(public navCtrl: NavController, 
    public sqlite: SQLite, 
    public dateformater: Dateformater,
    public navParams: NavParams, 
    public file: File,
    private emailComposer: EmailComposer) {

    this.openDataBase();

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ContactPage');
  }

  private openDataBase(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
        this.writeData();
      })
      .catch(e => console.log(e));
  }

  public writeData(){
    this.filename = this.dateformater.getdate()+'_apexData.csv';
    var sqlrequest = 'select * from `Session`';
    var alldata='id;Parcelle;Date;Heure;Latitude;Longitude;Apex pleine croissance;Apex croissante ralentie;Apex croissance arrétée;IAC;Moyenne;% Apex pleine croissance;% Apex croissance ralentie;% Apex croissance arrétée';

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
      this.file.writeFile(this.file.externalRootDirectory+'/apex',this.filename, alldata, {replace: true});
    });

  }

  sendEmail():void {
    if(this.emailtext != ""){
      let email = {
        to: this.emailtext,
        cc: 'agrotic.applications@gmail.com',
        attachments: [
          this.file.externalRootDirectory+'/apex/'+this.filename
        ],
        subject: '[ApeX] Contact',
        body: 'Vos données de l\'application Apx au format CSV.',
        isHtml: true
      };
      this.emailComposer.open(email);
    }
  }

}
