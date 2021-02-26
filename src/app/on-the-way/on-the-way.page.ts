import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ModalController } from '@ionic/angular'; 
import { ChatPage } from '../chat/chat.page'; 
@Component({
  selector: 'app-on-the-way',
  templateUrl: './on-the-way.page.html',
  styleUrls: ['./on-the-way.page.scss'],
})
export class OnTheWayPage implements OnInit {
   fabAction = false;
  constructor(private navCtrl: NavController, private modalController: ModalController) { }

  ngOnInit() {
  }
  toggleFab(){
     this.fabAction = !this.fabAction;
   } 
  delivered_succesfully() {
     this.navCtrl.navigateRoot(['./delivered-succesfully']);
  }
  chat(){  
    this.modalController.create({component:ChatPage}).then((modalElement)=>
    {
      modalElement.present();
    }
    )
  } 
}
