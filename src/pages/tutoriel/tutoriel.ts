import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Slides, ViewController, ModalController } from 'ionic-angular';
import { HomePage } from '../home/home';

@IonicPage()
@Component({
  selector: 'page-tutoriel',
  templateUrl: 'tutoriel.html',
})
export class TutorielPage {
  @ViewChild(Slides) slides: Slides;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController) {
  }

  nextS(){
    this.slides.slideNext();
  }
  prevS(){
    this.slides.slidePrev();
  }

  closeTuto(){
    this.navCtrl.setRoot(HomePage);
  }

  public openAuthentication() {
    var authenticationModal = this.modalCtrl.create('AuthenticationPage');
    authenticationModal.present();
  }

}
