import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
  
import { IonicModule } from '@ionic/angular';

import { AcceptedPageRoutingModule } from './accepted-routing.module';

import { AcceptedPage } from './accepted.page';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,    
    AcceptedPageRoutingModule
  ],
  providers: [GoogleMapsService, InAppBrowser, CallNumber],
  declarations: [AcceptedPage]
})
export class AcceptedPageModule {}
