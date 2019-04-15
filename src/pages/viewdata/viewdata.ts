import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController, ModalController } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Dateformater } from '../../services/dateformater.service';
import { Chart } from 'chart.js';

const DATABASE_APEX_NAME: string = 'dataApex.db';

@IonicPage()
@Component({
  selector: 'page-viewdata',
  templateUrl: 'viewdata.html',
})
export class ViewdataPage {

  @ViewChild('lineCanvasCroissance') lineCanvasCroissance;
  @ViewChild('lineCanvasContrainte') lineCanvasContrainte;

  private db: SQLiteObject;
  public idUser: string;
  public nomParcelle: string;
  public dataSession: any[];
  public lineChart: any;
  public lineChartContrainte: any;
  public globalLat:any;
  public globalLng:any;
  public labelChart:any[];
  public dataMoyenne:any[];
  public dataTxApexP:any[];
  public dataTxApexR:any[];
  public dataTxApexC:any[];
  public dataClasses:any[];
  public dataDates:any[];
  public ifv:number;
   
  constructor( public navCtrl: NavController,
    public modalCtrl: ModalController,
    public viewCtrl : ViewController,
    public alertCtrl: AlertController,
    public sqlite: SQLite,
    public dateformater: Dateformater,
    public navParams: NavParams) {
      
      this.idUser = this.navParams.get('iduser');
      this.nomParcelle = this.navParams.get('nomParcelleView');
      this.ifv = this.navParams.get('ifv');
      this.openDataBase();

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad View Data');
    //this.makeChartCroissance();
    
  }

  private openDataBase(): void {
    this.sqlite.create({
      name: DATABASE_APEX_NAME,
      location: 'default'
    })
      .then((db: SQLiteObject) => {
        console.log('DB opened !');
        this.db = db;
        this.getData();
      })
      .catch(e => console.log(e));
  }

  public getData() {
    this.dataSession = [];
    this.dataMoyenne = [];
    this.dataTxApexP = [];
    this.dataTxApexR = [];
    this.dataTxApexC = [];
    this.dataClasses = [];
    this.dataDates = [];
    this.db.executeSql('select * from `Session` WHERE nomParcelle = ? order by date desc', [this.nomParcelle])
      .then((data) => {
        if (data == null) {
          console.log('no session yet');
          this.closeModal();
          return;
        }
        if (data.rows) {
          if(data.rows.length == 0) this.closeModal();
          if (data.rows.length > 0) {
            this.globalLat = data.rows.item(0).globalLatitude.toFixed(5);
            this.globalLng = data.rows.item(0).globalLongitude.toFixed(5);
            for (let i = 0; i < data.rows.length; i++) {
              var date = this.dateformater.convertToDate(data.rows.item(i).date);
              //var time = this.dateformater.convertToTime(data.rows.item(i).date);
              
              if(i < 6) {
                var apexP= data.rows.item(i).apexP;
                var moyenne;
                var tauxApexP;
                var tauxApexR;
                var tauxApexC;
                var classe;

                // PARCELLE ROGNEE
                if (apexP == 999) {
                  moyenne = null;
                  tauxApexP =null;
                  tauxApexR =null;
                  tauxApexC =null;
                  classe=null;
                }else{
                  moyenne = data.rows.item(i).moyenne.toFixed(2);
                  var apexR= data.rows.item(i).apexR;
                  var apexC= data.rows.item(i).apexC;
                  var moyenne2 = ((apexP)+(apexR/2))/(apexP+apexR+apexC);
                  tauxApexP = (apexP/(apexC+apexP+apexR)*100).toFixed(1);
                  tauxApexR = (apexR/(apexC+apexP+apexR)*100).toFixed(1);
                  tauxApexC = (apexC/(apexC+apexP+apexR)*100).toFixed(1);
                  classe = '3';
  
                  // GESTION DES CLASSES
                  if (moyenne2 >= 0.75) {
                    classe = '0';
                  } else {
                    if (tauxApexP >= 5) {
                      classe = '1';
                    } else {
                      if (tauxApexC <= 90) {
                        classe = '2';
                      }
                    }
                  }
                }


                this.dataMoyenne.push(moyenne);
                this.dataTxApexP.push(tauxApexP);
                this.dataTxApexR.push(tauxApexR);
                this.dataTxApexC.push(tauxApexC);
                this.dataDates.push(date);
                this.dataClasses.push(classe);
              }
              
              this.dataSession.push({
                id: data.rows.item(i).idSession,
                nomParcelle: data.rows.item(i).nomParcelle,
                date: this.dateformater.convertToDate(data.rows.item(i).date),
                time: this.dateformater.convertToTime(data.rows.item(i).date),
                timestamp: data.rows.item(i).date,
                userId: data.rows.item(i).userId
              });
            }
          }
        }
        this.dataDates.reverse();
        this.makeChartCroissance();
        if (this.ifv == 1) {
          this.makeChartContrainte();
        }
        
      })
      .catch(e => console.log('fail sql retrieve Sessions ' + e));
  }

  public deleteParcelle() {
    this.db.executeSql('DELETE FROM `Session` WHERE nomParcelle = ?', [this.nomParcelle])
      .then(() => {
        console.log('delete parcelle : '+this.nomParcelle);
        this.closeModal();
      })
      .catch(e => console.log(e));
  }

  public editSession(id){
    var data = {
      idsession: id,
      nomParcelle: this.nomParcelle
    };
    var editSaisie = this.modalCtrl.create('EditPage', data);
    editSaisie.onDidDismiss(() => {
      this.getData();
    });
    editSaisie.present();
  }
  public trashSession(id){
    let confirm = this.alertCtrl.create({
      title: 'Vous voulez supprimer les données de cette parcelle ?',
      //message: 'Do you agree to use this lightsaber to do good across the intergalactic galaxy?',
      buttons: [{
          text: 'non',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Supprimer',
          handler: () => {
            this.deleteSession(id);
            this.getData();
            console.log('Agree clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  public deleteSession(id):void{
      var idSession = id
      this.db.executeSql('DELETE FROM `Session` WHERE idSession = ?', [idSession])
      .then(() => console.log('Session '+idSession+' deleted'))
      .catch(e => console.log(e));
    }
  

  public convertInteger(x) {
    return Number.parseInt(x);
  }
  
  public closeModal() {
      this.viewCtrl.dismiss();
  }

  public makeChartCroissance() {
    this.lineChart = new Chart(this.lineCanvasCroissance.nativeElement, {
      type: 'line',
      data: {
        labels: this.dataDates,
        datasets: [{
            label: 'Indice croiss.',
            yAxisID: 'A',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(242, 142, 146, 0.2)',
            borderColor: 'rgb(242, 142, 146)',
            borderCapStyle: 'square',
            borderDash: [], // try [5, 15] for instance
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "black",
            pointBackgroundColor: "white",
            pointBorderWidth: 1,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgb(242, 142, 146)',
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHitRadius: 10,
            data: this.dataMoyenne.reverse()
          },
          {
            label: '% pleine croiss.',
            yAxisID: 'B',
            fill: true,
            hidden: true,
            lineTension: 0.1,
            backgroundColor: "rgba(247, 201, 161, 0.2)",
            borderColor: 'rgb(247, 201, 161)', // The main line color
            borderCapStyle: 'square',
            borderDash: [5,5], // try [5, 15] for instance
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "black",
            pointBackgroundColor: "white",
            pointBorderWidth: 1,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgb(247, 201, 161)',
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHitRadius: 10,
            data: this.dataTxApexP.reverse()
          },
          {
            label: '% croiss. ralentie',
            yAxisID: 'B',
            fill: true,
            hidden: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(144, 190, 184, 0.2)',
            borderColor: 'rgb(144, 190, 184)', // The main line color
            borderCapStyle: 'square',
            borderDash: [5,5], // try [5, 15] for instance
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "black",
            pointBackgroundColor: "white",
            pointBorderWidth: 1,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgb(144, 190, 184)',
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHitRadius: 10,
            data: this.dataTxApexR.reverse()
          },
          {
            label: '% croiss. arrétée',
            yAxisID: 'B',
            fill: true,
            hidden: true,
            lineTension: 0.1,
            backgroundColor: 'rgba(105, 134, 143, 0.2)',
            borderColor: 'rgb(105, 134, 143)', // The main line color
            borderCapStyle: 'square',
            borderDash: [5, 5], // try [5, 15] for instance
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "black",
            pointBackgroundColor: "white",
            pointBorderWidth: 1,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgb(105, 134, 143)',
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHitRadius: 10,
            data: this.dataTxApexC.reverse()
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'bottom'
        },
        scales: {
          xAxes:[{
            ticks:{
              suggestedMax: 5
            }
          }],
          yAxes: [{
            id: 'A',
            type: 'linear',
            position: 'left',
            scaleLabel: {
              display: true,
              labelString: 'Indice croiss.',
              fontSize: 15
            },
            ticks: {
              max: 1,
              min: 0,
              stepSize: 0.2
            }
          }, {
            id: 'B',
            type: 'linear',
            position: 'right',
            scaleLabel: {
              display: true,
              labelString: '% Apex',
              fontSize: 15
            },
            ticks: {
              max: 100,
              min: 0,
              stepSize: 20
            }
          }]
        }
      }
    });
  }

  public makeChartContrainte() {
    this.lineChartContrainte = new Chart(this.lineCanvasContrainte.nativeElement, {
      type: 'line',
      data: {
        labels: this.dataDates,
        datasets: [{
            label: 'Contrainte hydrique',
            yAxisID: 'CH',
            fill: true,
            steppedLine: "middle",
            lineTension: 0.1,
            backgroundColor: 'rgba(151, 162, 191, 0.2)',
            borderColor: 'rgb(151, 162, 191)',
            borderCapStyle: 'square',
            borderDash: [], // try [5, 15] for instance
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "black",
            pointBackgroundColor: "white",
            pointBorderWidth: 1,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgb(151, 162, 191)',
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHitRadius: 10,
            data: this.dataClasses.reverse()
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'bottom'
        },
        scales: {
          xAxes:[{
            ticks:{
              suggestedMax: 5
            }
          }],
          yAxes: [{
            id: 'CH',
            type: 'linear',
            position: 'left',
            scaleLabel: {
              display: true,
              labelString: 'Classes',
              fontSize: 15
            },
            ticks: {
              max: 3,
              min: 0,
              stepSize: 1
            }
          }]
        }
      }
    });
  }

}