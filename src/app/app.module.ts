import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { SenddataPage } from '../pages/senddata/senddata';
import { ComptePage } from '../pages/compte/compte';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

//IMPORT NATIVE COMPONENTS
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Vibration } from '@ionic-native/vibration';
import { Device } from '@ionic-native/device';
import { SQLite } from '@ionic-native/sqlite';
import { HTTP } from '@ionic-native/http';
import { Keyboard } from '@ionic-native/keyboard';
import { Network } from '@ionic-native/network';
import { EmailComposer } from '@ionic-native/email-composer';
import { File } from '@ionic-native/file';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

//IMPORT SERVICES
import { LocationTracker } from '../services/locationtracker.service';
import { GUIDGenerator } from '../services/guidgenerator.service';
import { Dateformater } from '../services/dateformater.service';
import { ApexData } from '../services/apexdata.service';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AboutPage,
    SenddataPage,
    ContactPage,
    ComptePage
   ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AboutPage,
    ContactPage,
    SenddataPage,
    ComptePage
  ],
  providers: [
    StatusBar,
    Dateformater,
    GUIDGenerator,
    LocationTracker,
    ScreenOrientation,
    ApexData,
    Geolocation,
    BackgroundGeolocation,
    Vibration,
    EmailComposer,
    Device,
    Network,
    File,
    HTTP,
    Keyboard,
    SplashScreen,
    SQLite,
    {provide: ErrorHandler, useClass: IonicErrorHandler} ]
})
export class AppModule {}
