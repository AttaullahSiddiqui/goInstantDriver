import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';

import { Camera } from '@ionic-native/camera/ngx';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { Crop } from '@ionic-native/crop/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ProfilePageRoutingModule
  ], providers: [Camera, IOSFilePicker, Crop],
  declarations: [ProfilePage]
})
export class ProfilePageModule { }
