import { NgModule, enableProdMode, importProvidersFrom } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import { AngularFireModule } from '@angular/fire/compat';
import { provideFirestore } from '@angular/fire/firestore';
import { getFirestore } from 'firebase/firestore';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { IonicModule } from '@ionic/angular';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { IonicConfig, setupConfig } from '@ionic/core';

// Call the element loader before the bootstrapModule/bootstrapApplication call
defineCustomElements(window);

if (environment.production) {
  enableProdMode();
}

const config: IonicConfig = {
  innerHTMLTemplatesEnabled: true,
};

setupConfig(config);


bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    importProvidersFrom(provideFirebaseApp(()=>initializeApp(environment.firebaseConfig))),
    importProvidersFrom(provideFirestore(()=>getFirestore())),
    importProvidersFrom(AngularFirestoreModule),
    importProvidersFrom(AngularFireModule.initializeApp(environment.firebaseConfig)),
    importProvidersFrom(IonicModule.forRoot({})),
    importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebaseConfig))),
    importProvidersFrom(provideStorage(() => getStorage())),
    provideRouter(routes),
  ],
});

