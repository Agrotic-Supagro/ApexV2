import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public viewCtrl : ViewController,
    public device: Device,
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
    console.log(this.structure);
    console.log(this.name);
    console.log(this.email);
    if (this.validateEmail(this.email)) {
      if(this.structure != null && this.name != null && this.email != null){
        this.createDefaultUser();
        var data = { id: this.device.uuid, structure: this.structure, name:this.name };
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
      .then(() => console.log('User created ! Structure : '+structure+' and Name : '+name))
      .catch(e => console.log(e));
  }

  public showAlert(txt):void {
    let alert = this.alertCtrl.create({
      title: 'Authentification',
      subTitle: txt,
      buttons: ['OK']
    });
    alert.present();
  }
}
