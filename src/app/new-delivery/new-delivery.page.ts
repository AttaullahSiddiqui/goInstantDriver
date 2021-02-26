import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderRequest } from 'src/models/order-request.models';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../services/network/api.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { Subscription } from 'rxjs';
import { Helper } from 'src/models/helper.models';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { MyEventsService } from '../services/events/my-events.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import createHTMLMapMarker from '../../assets/scripts/html-map-marker.js';
import * as firebase from 'firebase';

@Component({
  selector: 'app-new-delivery',
  templateUrl: './new-delivery.page.html',
  styleUrls: ['./new-delivery.page.scss']
})
export class NewDeliveryPage implements OnInit, OnDestroy {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect: ElementRef;
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  private subscriptions = new Array<Subscription>();
  private initialized = false;
  private markerMe: google.maps.Marker;
  order_request: OrderRequest;
  distanceToShow = "--";
  durationToShow = "-- min";
  distance_metric = "km";

  constructor(private navCtrl: NavController, private translate: TranslateService, private router: Router, private maps: GoogleMapsService, private iab: InAppBrowser,
    private apiService: ApiService, private uiElementService: UiElementsService, private alertCtrl: AlertController, private myEvent: MyEventsService) { }

  ngOnInit() {
    let dm = Helper.getSettingValue("distance_metric");
    if (dm != null) this.distance_metric = dm.toLowerCase();

    if (this.router.getCurrentNavigation().extras.state && this.router.getCurrentNavigation().extras.state.order_request) this.order_request = this.router.getCurrentNavigation().extras.state.order_request;
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  ionViewDidEnter() {
    if (!this.initialized) {
      let selectedLocation = Helper.getLocation();
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement, selectedLocation).then(() => {
        this.initialized = true;
        this.plotMarkers(selectedLocation != null ? new google.maps.LatLng(Number(selectedLocation.latitude), Number(selectedLocation.longitude)) : null,
          new google.maps.LatLng(Number(this.order_request.order.vendor.latitude), Number(this.order_request.order.vendor.longitude)),
          new google.maps.LatLng(Number(this.order_request.order.address.latitude), Number(this.order_request.order.address.longitude)));
      }).catch(err => console.log(err));
      mapLoaded.catch(err => console.log(err));
    }
  }

  navRequest() {
    this.iab.create(("http://maps.google.com/maps?saddr=" + (this.order_request.order.address.latitude + "," + this.order_request.order.address.longitude) + "&daddr=" + (this.order_request.order.vendor.latitude + "," + this.order_request.order.vendor.longitude)), "_system");
  }

  plotMarkers(markerMePos: google.maps.LatLng, markerSourcePos: google.maps.LatLng, markerDestinationPos: google.maps.LatLng) {
    const component = this;
    if (this.initialized) {
      if (markerMePos != null) new google.maps.Marker({ position: markerMePos, map: this.maps.map });
      // if (markerSourcePos != null) new google.maps.Marker({ position: markerSourcePos, map: this.maps.map, icon: 'assets/images/marker_map_src.png' });
      // if (markerDestinationPos != null) new google.maps.Marker({ position: markerDestinationPos, map: this.maps.map, icon: 'assets/images/marker_map_dest.png' });
      if (markerSourcePos != null) {
        createHTMLMapMarker({
          latlng: markerSourcePos,
          map: this.maps.map,
          html: '<div id="doctor_map"><img src="' + this.order_request.order.vendor.image + '"></div>'
        });
      }
      if (markerDestinationPos != null) {
        createHTMLMapMarker({
          latlng: markerDestinationPos,
          map: this.maps.map,
          html: '<div id="doctor_map"><img src="' + this.order_request.order.user.image_url + '"></div>'
        });
      }

      let posBonds = new google.maps.LatLngBounds();
      if (markerMePos != null) posBonds.extend(markerMePos);
      if (markerSourcePos != null) posBonds.extend(markerSourcePos);
      if (markerDestinationPos != null) posBonds.extend(markerDestinationPos);

      if (!posBonds.isEmpty()) setTimeout(() => this.maps.map.panTo(posBonds.getCenter()), 200);

      let directionsService = new google.maps.DirectionsService();
      let directionsDisplay = new google.maps.DirectionsRenderer({
        map: this.maps.map,
        polylineOptions: {
          strokeColor: '#279411',
          strokeOpacity: 1.0,
          strokeWeight: 5
        },
        markerOptions: {
          opacity: 0,
          clickable: false,
          position: markerSourcePos
        }
      });
      let dirReq: any = {
        origin: markerSourcePos,
        destination: markerDestinationPos,
        travelMode: google.maps.TravelMode.DRIVING
      };
      directionsService.route(dirReq, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
          component.computeTotalDistance(result);
        }
      });

    }
  }

  confirmUpdate(status) {
    let keyTitle = status == "accepted" ? "confirm_accept_title" : "confirm_reject_title";
    let keyMessage = status == "accepted" ? "confirm_accept_message" : "confirm_reject_message";
    this.translate.get([keyTitle, keyMessage, "yes", "no"]).subscribe(values => {
      this.alertCtrl.create({
        header: values[keyTitle],
        message: values[keyMessage],
        buttons: [{
          text: values["no"],
          handler: () => { }
        }, {
          text: values["yes"],
          handler: () => {
            this.updateRequest(status);
          }
        }]
      }).then(alert => alert.present());
    });
  }

  updateRequest(status) {
    this.translate.get(["updating", "something_wrong"]).subscribe(values => {
      this.uiElementService.presentLoading(values["updating"]);
      firebase.database().ref("deliveries").child(String(this.order_request.delivery.id)).child("order-request").child("status").set(status);
      this.subscriptions.push(this.apiService.updateOrderRequest({ status: status }, this.order_request.id).subscribe(res => {

        this.apiService.updateProfile({ is_online: 1 }, this.order_request.delivery.id).subscribe(res => {
          this.uiElementService.dismissLoading();
          this.navCtrl.pop();
          this.myEvent.setProfileData(res);
        }, err => {
          console.log("updateOrder", err);
          this.uiElementService.presentToast(values["something_wrong"]);
          this.uiElementService.dismissLoading();
          this.navCtrl.pop();
        });

      }, err => {
        console.log("updateOrder", err);
        this.uiElementService.presentToast(values["something_wrong"]);
        this.uiElementService.dismissLoading();
        this.navCtrl.pop();
      }));
    });
  }

  computeTotalDistance(result: google.maps.DirectionsResult) {
    let totalDistance = 0, totalDuration = 0;
    const myroute = result.routes[0];
    for (let i = 0; i < myroute.legs.length; i++) {
      totalDistance += myroute.legs[i].distance.value;
      totalDuration += myroute.legs[i].duration.value;
    }
    Helper.setOrderDistanceDuration(this.order_request.order.id, { distance: totalDistance, duration: totalDuration });
    this.distanceToShow = Helper.formatDistance(totalDistance, this.distance_metric);
    this.durationToShow = Helper.formatDuration(totalDuration);

    let refOrderStat = firebase.database().ref().child("deliveries").child(String(Helper.getProfile().id)).child("order_stats").child(String(this.order_request.order.id));
    refOrderStat.set({ distance: totalDistance, duration: totalDuration });
  }

}
