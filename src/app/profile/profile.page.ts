import { Component, OnInit, OnDestroy } from '@angular/core';
import { Profile } from 'src/models/profile.models';
import { Subscription } from 'rxjs';
import { NavController, Platform, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { FirebaseUploaderService } from '../services/network/firebase-uploader.service';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { Crop } from '@ionic-native/crop/ngx';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit, OnDestroy {
  profile = new Profile();
  fresh_profile: boolean;
  private subscriptions = new Array<Subscription>();
  private imageType = 1;

  constructor(private navCtrl: NavController, private translate: TranslateService, private router: Router, private platform: Platform, private myEvent: MyEventsService,
    private iosFilePicker: IOSFilePicker, private cropService: Crop, private fireUpService: FirebaseUploaderService, private myEvents: MyEventsService,
    private apiService: ApiService, private uiElementService: UiElementsService, private alertCtrl: AlertController, private camera: Camera) { }

  ngOnInit() {
    if (this.router.getCurrentNavigation().extras.state) this.fresh_profile = this.router.getCurrentNavigation().extras.state.fresh_profile;

    this.profile = new Profile();
    this.translate.get(["just_moment", "something_wrong"]).subscribe(values => {
      this.uiElementService.presentLoading(values["just_moment"]);
      this.subscriptions.push(this.apiService.getProfile().subscribe(resProfile => {
        setTimeout(() => {
          this.profile = resProfile;
          this.uiElementService.dismissLoading();
        }, 500);
      }, err => {
        console.log("getProfile", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.presentToast(values["something_wrong"], "top");
        this.navCtrl.pop();
      }));
    });

    // setTimeout(() => {
    //   this.profile.meta.document_url = null;
    // }, 2000);

    // setTimeout(() => {
    //   this.profile.meta.document_url = "https://i.picsum.photos/id/323/200/200.jpg?hmac=EoedzCHJZRv1-7_RBKDcba4cXIfclsicfsYbW3-VEsA";
    // }, 5000);

    // setTimeout(() => {
    //   this.profile.user.image_url = "https://i.picsum.photos/id/947/200/200.jpg?hmac=Nso8kNr17S_Y5Rr6XXnifQUmzulyyA29wQXwgsJmb8A";
    //   this.updateUserImage("https://i.picsum.photos/id/947/200/200.jpg?hmac=Nso8kNr17S_Y5Rr6XXnifQUmzulyyA29wQXwgsJmb8A");
    // }, 5000);
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  pickImageUser() {
    this.imageType = 1;
    this.translate.get(["image_pic_header", "image_pic_subheader", "image_pic_camera", "image_pic_gallery"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["image_pic_header"],
        message: values["image_pic_subheader"],
        buttons: [{
          text: values["image_pic_camera"],
          handler: () => {
            this.getImageCamera();
          }
        }, {
          text: values["image_pic_gallery"],
          handler: () => {
            this.getImageGallery();
          }
        }]
      }).then(alert => alert.present());
    });
  }

  pickImageProfile() {
    this.imageType = 2;
    this.getImageCamera();
  }

  getImageGallery() {
    const component = this;
    this.platform.ready().then(() => {
      if (this.platform.is("android")) {
        //{ "mime": "application/pdf" }  // text/plain, image/png, image/jpeg, audio/wav etc
        //(<any>window).fileChooser.open({ "mime": component.uploadType == 1 ? "image/jpeg" : "application/*" }, (uri) => component.resolveUri(uri), (err) => console.log("fileChooser", err)); // with mime filter
        (<any>window).fileChooser.open({ "mime": "image/*" }, (uri) => component.reduceImages(uri), (err) => console.log("fileChooser", err)); // with mime filter
      } else if (this.platform.is("ios")) {
        this.iosFilePicker.pickFile().then(uri => component.reduceImages(uri));
      }

      // if (this.platform.is("cordova")) {
      //   this.imagePicker.getPictures({
      //     maximumImagesCount: 1,
      //   }).then((results) => {
      //     if (results && results[0]) {
      //       if (this.imageType == 1) {
      //         this.reduceImages(results).then(() => console.log('cropped_images'));
      //       } else {
      //         this.uploadImage(results[0]);
      //       }
      //     }
      //   }, (err) => {
      //     console.log("getPictures", JSON.stringify(err));
      //   });
      // }
    });
  }

  reduceImages(selected_pictures: string) {
    // return selected_pictures.reduce((promise: any, item: any) => {
    //   return promise.then((result) => {
    //     return this.cropService.crop(item, { quality: 100 }).then(cropped_image => this.uploadImage(cropped_image));
    //   });
    // }, Promise.resolve());
    this.cropService.crop(selected_pictures, { quality: 100 }).then(cropped_image => this.uploadImage(cropped_image));
  }

  getImageCamera() {
    const options: CameraOptions = {
      quality: 75,
      destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.NATIVE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) => {
      if (this.imageType == 1) {
        this.reduceImages(imageData);
      } else {
        this.uploadImage(imageData);
      }
    }, (err) => {
      this.translate.get('camera_err').subscribe(value => this.uiElementService.presentToast(value, "top"));
      console.log("getPicture", JSON.stringify(err));
    });
  }

  uploadImage(imageUri) {
    this.translate.get(["uploading_image", "uploading_fail"]).subscribe(values => {
      this.uiElementService.presentLoading(values["uploading_image"]);
      this.fireUpService.resolveUriAndUpload(imageUri).then(res => {
        console.log("resolveUriAndUpload", res);
        let imageUrl = String(res);
        if (this.imageType == 1) {
          this.profile.user.image_url = imageUrl;
          this.updateUserImage(imageUrl);
        } else if (this.imageType == 2) {
          this.profile.meta.document_url = imageUrl;
          this.uiElementService.dismissLoading();
        }
      }, err => {
        console.log("resolveUriAndUpload", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.presentErrorAlert(values["uploading_fail"]);
      });
    });
  }

  private updateUserImage(imgUrl) {
    this.apiService.updateUser({ image_url: imgUrl }).subscribe(res => {
      let profileMe = Helper.getProfile();
      if (profileMe != null) {
        profileMe.user = res;
        Helper.setProfile(profileMe);
        this.myEvents.setProfileData(profileMe);
      }
      this.uiElementService.dismissLoading();
    }, err => { console.log('updateUser', err); this.uiElementService.dismissLoading(); });
  }

  update() {
    if (!this.profile.user.name || !this.profile.user.name.length) {
      this.translate.get("err_field_profile_name").subscribe(value => this.uiElementService.presentToast(value, "top"));
    } else if (!this.profile.meta.gender || !this.profile.meta.gender.length) {
      this.translate.get("err_field_profile_gender").subscribe(value => this.uiElementService.presentToast(value, "top"));
    } else if (!this.profile.meta.document_url || !this.profile.meta.document_url.length) {
      this.translate.get("err_field_profile_document_url").subscribe(value => this.uiElementService.presentToast(value, "top"));
    } else {
      let pur = {
        meta: JSON.stringify(this.profile.meta),
        is_online: this.fresh_profile ? 1 : this.profile.is_online
      };
      this.translate.get(["updating", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["updating"]);
        this.subscriptions.push(this.apiService.updateProfile(pur, this.profile.id).subscribe(res => {
          this.myEvents.setProfileData(res);
          this.uiElementService.dismissLoading();
        }, err => {
          console.log("updateProfile", err);
          this.uiElementService.dismissLoading();
        }));
      });
    }
  }

  exitApp() {
    Helper.setLoggedInUserResponse(null);
    this.myEvent.setLoginData(null);
  }

}
