import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';
//import {HTTP} from '@ionic-native/http';

const SERVEUR_APEX_NAME: string = 'http://www.gbrunel.fr/ionic/';
const API_APEX_FILE: string = "apiApex.php";

@Injectable()
export class ApexData {

  public url: string = SERVEUR_APEX_NAME+API_APEX_FILE;

  constructor(
  ) {

  }



}
