import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { NewDeliveryPageRoutingModule } from './new-delivery-routing.module';

import { NewDeliveryPage } from './new-delivery.page';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    NewDeliveryPageRoutingModule
  ],
  providers: [GoogleMapsService, InAppBrowser],
  declarations: [NewDeliveryPage]
})
export class NewDeliveryPageModule { }
