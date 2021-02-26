import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Helper } from 'src/models/helper.models';
import * as firebase from 'firebase';

@Component({
  selector: 'app-delivered-succesfully',
  templateUrl: './delivered-succesfully.page.html',
  styleUrls: ['./delivered-succesfully.page.scss']
})
export class DeliveredSuccesfullyPage implements OnInit {
  delivery_fee: string;
  distanceToShow = "--";
  durationToShow = "-- min";
  distance_metric = "km";

  constructor(private navCtrl: NavController, private route: ActivatedRoute) { }

  ngOnInit() {
    let dm = Helper.getSettingValue("distance_metric");
    if (dm != null) this.distance_metric = dm.toLowerCase();

    this.route.queryParams.subscribe(params => {
      let order_id = params["order_id"];
      this.delivery_fee = params["delivery_fee"];

      const dm = Helper.getOrderDistanceDuration(Number(order_id));
      if (dm != null) {
        this.distanceToShow = Helper.formatDistance(dm.distance, this.distance_metric);
        this.durationToShow = Helper.formatDuration(dm.duration);

        //let refDeliveryStat = firebase.database().ref().child("deliveries").child(String(Helper.getProfile().id)).child("delivery_stat");
        //refOrderStat.set({ distance: totalDistance, duration: totalDuration });

        const refDeliveryStat = firebase.database().ref().child("deliveries").child(String(Helper.getProfile().id)).child("delivery_stat");
        refDeliveryStat.once('value').then(function (snapshot) {
          let deliveryStat: { distance: number, duration: number } = snapshot.val();
          refDeliveryStat.set({ distance: deliveryStat ? deliveryStat.distance + dm.distance : dm.distance, duration: deliveryStat ? deliveryStat.duration + dm.duration : dm.duration });
        });
      }
    });
  }

  goHome() {
    window.localStorage.setItem("recheck", "true");
    this.navCtrl.navigateRoot(['./home']);
  }
  order_info() {
    //this.route.navigate(['./order-history']);
  }
  view_earnings() {
    //this.navCtrl.navigateRoot(['./wallet']);
  }
}
