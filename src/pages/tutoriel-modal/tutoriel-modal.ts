import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Slides, ViewController, ModalController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-tutoriel-modal',
  templateUrl: 'tutoriel-modal.html',
})
export class TutorielModalPage {
  @ViewChild(Slides) slides: Slides;

  public isBegin: boolean = true;
  public isEnd: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController) {
    
  }

  nextS(){
    this.slides.slideNext();
  }
  prevS(){
    this.slides.slidePrev();
  }

  closeTuto(){
      this.openAuthentication();
  }

  public openAuthentication() {
    var authenticationModal = this.modalCtrl.create('AuthenticationPage');
    authenticationModal.onDidDismiss((data) => {
      this.viewCtrl.dismiss(data);
    });
    authenticationModal.present();
  }

  slideChanged() {
    if (this.slides.isEnd()) {
      this.isEnd = true;
    } else {
      if (this.slides.isBeginning()) {
        this.isBegin = true;
      } else {
        this.isBegin = false;
        this.isEnd = false;
      }
    }
  }
}
