import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';


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

//IMPORT SERVICES
import { LocationTracker } from '../services/locationtracker.service';
import { GUIDGenerator } from '../services/guidgenerator.service';
import { Dateformater } from '../services/dateformater.service';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AboutPage,
    ContactPage
   ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AboutPage,
    ContactPage
  ],
  providers: [
    StatusBar,
    Dateformater,
    GUIDGenerator,
    LocationTracker,
    Geolocation,
    BackgroundGeolocation,
    Vibration,
    Device,
    HTTP,
    Keyboard,
    SplashScreen,
    SQLite,
    {provide: ErrorHandler, useClass: IonicErrorHandler} ]
})
export class AppModule {}
