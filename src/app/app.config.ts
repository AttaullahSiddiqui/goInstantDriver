import { InjectionToken } from "@angular/core";

export let APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface FirebaseConfig {
    apiKey: string,
    authDomain: string,
    databaseURL: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    webApplicationId: string
}

export interface AppConfig {
    appName: string;
    apiBase: string;
    googleApiKey: string;
    oneSignalAppId: string;
    oneSignalGPSenderId: string;
    availableLanguages: Array<{ code: string, name: string }>;
    firebaseConfig: FirebaseConfig;
    demoMode: boolean;
}

export const BaseAppConfig: AppConfig = {
    appName: "GoInstant Driver",
    apiBase: "http://admin.goinstants.co.za/",
    googleApiKey: "AIzaSyCNEvL2gUcnlLJRaaV_UAd8XO4HkT0IL1Q",
    oneSignalAppId: "4c9e1581-ca16-49e8-aad4-ef9865f5caa8",
    oneSignalGPSenderId: "630267082657",
    availableLanguages: [{
        code: 'en',
        name: 'English'
    }, {
        code: 'ar',
        name: 'Arabic'
    }],
    demoMode: false,
    firebaseConfig: {
        webApplicationId: "AIzaSyA2BqE4CmMFWJsrJso7kzTqnkbYP4dKdec",
        apiKey: "AIzaSyA2BqE4CmMFWJsrJso7kzTqnkbYP4dKdec",
        authDomain: "goinstant-84099.firebaseapp.com",
        databaseURL: "https://goinstant-84099-default-rtdb.firebaseio.com",
        projectId: "goinstant-84099",
        storageBucket: "goinstant-84099.appspot.com",
        messagingSenderId: "630267082657"
    }
};