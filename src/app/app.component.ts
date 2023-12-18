import { Component, NgModule } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { IonicConfig, setupConfig } from '@ionic/core';

const config: IonicConfig = {
  innerHTMLTemplatesEnabled: true,
};

setupConfig(config);

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})

export class AppComponent {
  constructor() {}
}
