import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TutorielModalPage } from './tutoriel-modal';

@NgModule({
  declarations: [
    TutorielModalPage,
  ],
  imports: [
    IonicPageModule.forChild(TutorielModalPage),
  ],
})
export class TutorielModalPageModule {}
