import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { environment } from '../environment';
import * as moment from 'moment/moment';

@Injectable()
export class PrintViewService {
  public printableMode: boolean = false;
  private disableAfterPrinting: boolean = true;

  constructor() {
    console.log("Init printable service");
    window.onafterprint = (e) => {
      if (this.disableAfterPrinting) {
        this.printableMode = false;
      }
    };
  }

  setAutoDisable(disableAfter: boolean) {
    this.disableAfterPrinting = disableAfter;
  }

  toggle() {
    this.printableMode = !this.printableMode;
  }
}
