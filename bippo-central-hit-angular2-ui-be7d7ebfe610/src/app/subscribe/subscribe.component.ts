import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../auth/auth.service';
import { environment } from '../environment';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-subscribe',
  templateUrl: 'subscribe.component.html',
  styleUrls: ['subscribe.component.css']
})
export class SubscribeComponent implements OnInit {
  ngZone: NgZone;
  authService: AuthService;
  firstName: string = '';
  lastName: string = '';
  companyName: string = '';
  checkedCustomer: boolean = false;
  needsCustomer: boolean = false;
  submittedCustomer: boolean = false;
  requestingPage: boolean = false;
  errorSubmittingCustomer: boolean = false;
  hostedPage: string = null;
  claimedToSubscribe: boolean = false;
  clickedSubmit: boolean = false;

  constructor(
    private router: Router,
    ngZone: NgZone,
    authService: AuthService
  ) {
    this.ngZone = ngZone;
    this.authService = authService;
    console.log("Init subscribe component!");
  }

  ngOnInit() {
    this.checkedCustomer = false;
    this.needsCustomer = false;
    this.submittedCustomer = false;
    this.errorSubmittingCustomer = false;
    this.requestingPage = false;
    this.hostedPage = null;
    this.claimedToSubscribe = false;
    this.clickedSubmit = false;

    this.checkCustomer();
  }

  checkCustomer() {
    this.authService.checkCustomerInfo(hasCustomer => {
      this.checkedCustomer = true;
      this.needsCustomer = !hasCustomer;

      if (!this.needsCustomer) {
        this.requestHostedPage();
      }
    }, (error, caught) => {
      this.checkedCustomer = true;
      this.needsCustomer = true;
    });
  }

  submitCustomer() {
    if (this.firstName && this.lastName) {
      this.clickedSubmit = true;

      this.authService.initCustomerInfo(this.firstName, this.lastName, this.companyName, () => {
        this.submittedCustomer = true;
        this.requestHostedPage();
        this.clickedSubmit = false;
      }, (error, caught) => {
        this.clickedSubmit = false;
        this.errorSubmittingCustomer = true;
        console.log('Error submitting customer info', error, caught);
      });
    }
  }

  requestHostedPage() {
    this.requestingPage = true;
    this.authService.initHostedPage(url => {
      console.log('HostedPage url ', url);
      this.hostedPage = url;
      setTimeout(() => this.openHostedPage(), 1000);
    }, (error, caught) => {
      console.log('Error requesting HostedPage', error, caught);
    });
  }

  openHostedPage() {
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = this.hostedPage;
    link.setAttribute('visibility', 'hidden');
    link.click();
  }

  claimSubscribe() {
    this.claimedToSubscribe = true;
  }

  logout() {
    this.authService.handleLogout();
    this.router.navigate(['/login']);
  }
}
