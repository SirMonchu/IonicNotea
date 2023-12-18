import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tab1Page } from './tab1.page';
import { IonicConfig, setupConfig } from '@ionic/core';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  

const config: IonicConfig = {
  innerHTMLTemplatesEnabled: true,
};

setupConfig(config);

  beforeEach(async () => {
    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
