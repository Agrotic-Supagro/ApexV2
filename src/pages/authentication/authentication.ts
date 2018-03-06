import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

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

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    private sqlite: SQLite) {
      this.openDB();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AuthenticationPage');
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
    if(this.structure != ''){
      this.createDefaultUser();
      this.viewCtrl.dismiss();
    }
    else{
      this.showAlert();
    }
  }

  private createDefaultUser(): void {
    var structure = this.structure;
    var name = this.name;
    this.db.executeSql('INSERT INTO `User` (structure, name) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM `User` WHERE structure=? AND name=?)', [structure,name,structure,name])
      .then(() => console.log('User created ! Structure : '+structure+' and Name : '+name))
      .catch(e => console.log(e));
  }

  public showAlert():void {
    let alert = this.alertCtrl.create({
      title: 'Authentification',
      subTitle: 'Merci de renseigner au moins le champs "structure" !',
      buttons: ['OK']
    });
    alert.present();
  }
}
