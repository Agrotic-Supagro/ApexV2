import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SenddataPage } from './senddata';

@NgModule({
  declarations: [
    SenddataPage,
  ],
  imports: [
    IonicPageModule.forChild(SenddataPage),
  ],
})
export class SenddataPageModule {}
