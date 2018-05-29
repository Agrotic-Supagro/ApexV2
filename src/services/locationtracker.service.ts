import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';

/*
Generated class for the LocationTracker provider.

See https://angular.io/docs/ts/latest/guide/dependency-injection.html
for more info on providers and Angular 2 DI.
*/
@Injectable()
export class LocationTracker {
  public watch: any;
  public lat: number = 0;
  public lng: number = 0;

  constructor(
    public zone: NgZone,
    public backgroundGeolocation:BackgroundGeolocation,
    public geolocation:Geolocation ) {

    }

    startTracking() {

      // Background Tracking

      let config = {
        desiredAccuracy: 10,
        stationaryRadius: 20,
        distanceFilter: 10,
        debug: false,
        enableHighAccuracy : true,
        interval: 2000
      };

      this.backgroundGeolocation.configure(config).subscribe((location) => {

        // Run update inside of Angular's zone
        this.zone.run(() => {
          this.lat = location.latitude;
          this.lng = location.longitude;
        });

      }, (err) => {

        console.log(err);

      });

      // Turn ON the background-geolocation system.
      this.backgroundGeolocation.start();


      // Foreground Tracking

      let options = {
        frequency: 2000,
        enableHighAccuracy: true
      };

      this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {

        // Run update inside of Angular's zone
        this.zone.run(() => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
        });

      });
    }

    getLongitude():any{
      return this.lng;
    }

    getLatitude():any{
      return this.lat;
    }

    stopTracking() {
      console.log('stopTracking');

      this.lng = null;
      this.lat = null;
      this.backgroundGeolocation.finish();
      this.watch.unsubscribe();

    }

  }
