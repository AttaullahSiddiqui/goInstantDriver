import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { UiElementsService } from '../services/common/ui-elements.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Order, OrderDeliveryProfile } from 'src/models/order.models';
import { Helper } from 'src/models/helper.models';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { MyAddress } from 'src/models/address.models';
import { ChatPage } from '../chat/chat.page';
import { Chat } from 'src/models/chat.models';
import { Constants } from 'src/models/constants.models';
import createHTMLMapMarker from '../../assets/scripts/html-map-marker.js';

@Component({
  selector: 'app-accepted',
  templateUrl: './accepted.page.html',
  styleUrls: ['./accepted.page.scss'],
})
export class AcceptedPage implements OnInit, OnDestroy {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect: ElementRef;
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  private subscriptions = new Array<Subscription>();
  private initialized = false;
  private locationMe: MyAddress;
  order = new Order();
  fabAction = false;
  actionText: string;
  distanceToShow = "--";
  durationToShow = "-- min";
  distance_metric = "km";

  constructor(private route: ActivatedRoute, private uiElementService: UiElementsService, private myEvent: MyEventsService,
    private iab: InAppBrowser, private alertCtrl: AlertController, private callNumber: CallNumber, private modalController: ModalController,
    private apiService: ApiService, private translate: TranslateService, private navCtrl: NavController, private maps: GoogleMapsService) { }

  ngOnInit() {
    let dm = Helper.getSettingValue("distance_metric");
    if (dm != null) this.distance_metric = dm.toLowerCase();

    this.route.queryParams.subscribe(params => {
      let order_id = params["order_id"];
      this.subscriptions.push(this.apiService.getOrderById(order_id).subscribe(res => {
        if (!res.delivery) res.delivery = new OrderDeliveryProfile();
        this.order = res;
        this.setupActionText();
        setTimeout(() => {
          this.plotMarkers(this.locationMe != null ? new google.maps.LatLng(Number(this.locationMe.latitude), Number(this.locationMe.longitude)) : null,
            new google.maps.LatLng(Number(this.order.vendor.latitude), Number(this.order.vendor.longitude)),
            new google.maps.LatLng(Number(this.order.address.latitude), Number(this.order.address.longitude)));
        }, 200);
      }, err => {
        console.log("getOrderById", err);
        this.navCtrl.navigateRoot(['./home']);
      }));
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  ionViewDidEnter() {
    if (!this.initialized) {
      this.locationMe = Helper.getLocation();
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement, this.locationMe).then(() => {
        this.initialized = true;
      }).catch(err => console.log(err));
      mapLoaded.catch(err => console.log(err));
    }
  }

  confirmNavigation() {
    this.translate.get(["directions_title", "directions_message", "directions_customer", "directions_vendor"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["directions_title"],
        message: values["directions_message"],
        buttons: [{
          text: values["directions_vendor"],
          handler: () => {
            this.iab.create(("http://maps.google.com/maps?daddr=" + (this.order.vendor.latitude + "," + this.order.vendor.longitude)), "_system");
          }
        }, {
          text: values["directions_customer"],
          handler: () => {
            this.iab.create(("http://maps.google.com/maps?daddr=" + (this.order.address.latitude + "," + this.order.address.longitude)), "_system");
          }
        }]
      }).then(alert => alert.present());
    });
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
          html: '<div id="doctor_map"><img src="' + this.order.vendor.image + '"></div>'
        });
      }
      if (markerDestinationPos != null) {
        createHTMLMapMarker({
          latlng: markerDestinationPos,
          map: this.maps.map,
          html: '<div id="doctor_map"><img src="' + this.order.user.image_url + '"></div>'
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

  toggleFab() {
    this.fabAction = !this.fabAction;
  }

  dialVendor() {
    this.callNumber.callNumber(this.order.vendor.user.mobile_number, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  }

  dialCustomer() {
    this.callNumber.callNumber(this.order.user.mobile_number, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  }

  setupActionText() {
    let transKey = "order_action_allotted";
    if (this.order.delivery.status == "started") {
      transKey = "order_action_started";
    } else if (this.order.delivery.status == "pickup") {
      transKey = "order_action_pickup";
    } else if (this.order.delivery.status == "complete") {
      transKey = "order_action_complete";
    }
    this.translate.get(transKey).subscribe(value => this.actionText = value);
  }

  actionOrder() {
    let toUpdate = null;
    if (this.order.delivery.status == "allotted") {
      toUpdate = "pickup";
    } else if (this.order.delivery.status == "pickup") {
      toUpdate = "started";
    } else if (this.order.delivery.status == "started") {
      toUpdate = "complete";
    }

    if (toUpdate != null) {
      if (toUpdate == "started") {
        this.translate.get(["just_moment", "something_wrong", "dispatched_na"]).subscribe(values => {
          this.uiElementService.presentLoading(values["just_moment"]);
          this.subscriptions.push(this.apiService.getOrderById(this.order.id).subscribe(res => {
            this.uiElementService.dismissLoading();
            if (res.status == "dispatched") {
              this.updateOrder("started");
            } else {
              this.uiElementService.presentToast(values["dispatched_na"]);
            }
          }, err => {
            console.log("getOrderById", err);
            this.uiElementService.dismissLoading();
            this.uiElementService.presentToast(values["something_wrong"]);
          }));
        });
      } else {
        this.updateOrder(toUpdate);
      }
    } else if (this.order.delivery.status == "complete") {
      let navigationExtras: NavigationExtras = { state: { order: this.order } };
      this.navCtrl.navigateForward(['./delivered-succesfully'], navigationExtras);
    }
  }

  updateOrder(status) {
    this.translate.get(["updating", "something_wrong"]).subscribe(values => {
      this.uiElementService.presentLoading(values["updating"]);
      this.subscriptions.push(this.apiService.updateOrder({ delivery_status: status }, this.order.id).subscribe(res => {
        this.order = res;
        this.setupActionText();
        this.uiElementService.dismissLoading();
        if (this.order.delivery.status == "complete") {
          let navigationExtras: NavigationExtras = { queryParams: { order_id: res.id, delivery_fee: this.order.delivery_fee_toshow } };
          this.navCtrl.navigateForward(['./delivered-succesfully'], navigationExtras);
        }
      }, err => {
        console.log("updateOrder", err);
        this.uiElementService.presentToast(values["something_wrong"]);
        this.uiElementService.dismissLoading();
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
    Helper.setOrderDistanceDuration(this.order.id, { distance: totalDistance, duration: totalDuration });
    this.distanceToShow = Helper.formatDistance(totalDistance, this.distance_metric);
    this.durationToShow = Helper.formatDuration(totalDuration);
  }


  navChat(role: string) {
    let chat = new Chat();
    chat.chatId = role == "vendor" ? (this.order.vendor.user_id + Constants.ROLE_VENDOR) : (this.order.user_id + Constants.ROLE_USER);
    chat.chatImage = role == "vendor" ? this.order.vendor.image : this.order.user.image_url;
    chat.chatName = role == "vendor" ? this.order.vendor.name : this.order.user.name;
    chat.chatStatus = role == "vendor" ? Constants.ROLE_VENDOR : Constants.ROLE_USER;
    chat.myId = this.order.delivery.delivery.user.id + Constants.ROLE_DELIVERY;

    this.modalController.create({ component: ChatPage, componentProps: { chat: chat } }).then((modalElement) => modalElement.present());
  }
}
