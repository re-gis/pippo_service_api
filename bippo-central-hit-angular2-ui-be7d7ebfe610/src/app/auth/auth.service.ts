import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Router, NavigationStart, NavigationEnd, Event as NavigationEvent } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { LocalStorageService } from 'angular-2-local-storage';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { environment } from '../environment';
import { SelectOption } from '../search/search.service';

@Injectable()
export class AuthService {
  user: any;
  register: any;
  profile: any;
  contract: any;
  account: any;
  login: any;
  reset: any;
  token: string;
  states: Array<string> = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Washington DC',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Puerto Rico',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming'
  ];
  homeWarrantyServiceProviders: Array<SelectOption>;
  baseUploadOptions: any = {
    autoUpload: true,
    filters: [{
        name: 'CSV files',
        fn: function(item) {
            return (item.name.substr(item.name.length - 4).toLowerCase() == ".csv");
        }
    }],
    onCompleteAll: function() {
        // TODO
    }
  };
  corpCharterUploader: FileUploader;
  corpCharterUploaderHover: boolean = false;
  corpSignatoryUploader: FileUploader;
  corpSignatoryUploaderHover: boolean = false;
  llcFormationUploader: FileUploader;
  llcFormationUploaderHover: boolean = false;
  llcSignatoryUploader: FileUploader;
  llcSignatoryUploaderHover: boolean = false;
  fundingSourceCashUploader: FileUploader;
  fundingSourceCashUploaderHover: boolean = false;
  fundingSourceLenderUploader: FileUploader;
  fundingSourceLenderUploaderHover: boolean = false;
  locUploader: FileUploader;
  locUploaderHover: boolean = false;
  earnestCheckUploader: FileUploader;
  earnestCheckUploaderHover: boolean = false;
  optionCheckUploader: FileUploader;
  optionCheckUploaderHover: boolean = false;
  contractDetails: any = {};
  private lastTokenCheck: number = 0;

  constructor(private _http: Http,
    private localStorageService: LocalStorageService,
    private router: Router) {
    console.log("Init auth!");
    this.register = {
        applicationId: 2, // TODO: Pass a magic string instead of a magic number in the future?
    };
    this.login = {
        grant_type: "password"
    };
    this.profile = {};
    this.contract = {};
    this.account = {};
    this.reset = {};
    this.token = null;

    this.corpCharterUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.corpSignatoryUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.llcFormationUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.llcSignatoryUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.fundingSourceCashUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.fundingSourceLenderUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.locUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.earnestCheckUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));
    this.optionCheckUploader = new FileUploader(Object.assign({
        url: ""
    }, this.baseUploadOptions));

    this.homeWarrantyServiceProviders = [];

    router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.checkTokenOnPageNavigation();
      }
    });
  }

  toggleLicense(license: string) {
    let pos = this.profile.licensesArray.indexOf(license);
    if (-1 !== pos) {
      this.profile.licensesArray.splice(pos, 1);
    } else {
      this.profile.licensesArray.push(license);
    }
  }

  hasLicense(license: string) {
    return (-1 !== this.profile.licensesArray.indexOf(license));
  }

  handleRegister(submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/json' });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'api/users/register',
          JSON.stringify(this.register), options)
        .subscribe(
          (res) => {
            console.log("handleRegister", res);
            if (201 === res["status"]) {
              submitHandler(res);
            } else {
              errorHandler(res);
            }
          },
          (error) => {
            console.log("handleRegister error", error);
            errorHandler(error);
          }
        );
  }

  handleLogin(submitHandler, errorHandler) {
      let encoded = btoa("bippo:secret");
      let headers = new Headers({
        'Authorization': 'Basic ' + encoded,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'oauth/token',
          $["param"](this.login), options)
        .subscribe(
          (res) => {
            console.log("handleLogin", res);
            if (200 === res["status"]) {
              this.token = res.json().access_token;
              this.localStorageService.set("auth-token", this.token);
              this.getUserData(errorHandler);
              submitHandler(true);
            } else {
              errorHandler(res.json());
            }
          },
          (error) => {
            console.log("handleLogin error", error);
            if (400 === error["status"]) {
              if ("User is disabled" === error.json().error_description) {
                errorHandler("unconfirmed");
                return;
              }
            }
            errorHandler(error);
          }
        );
  }

  decodeJwt(token) {
      let base64Url = token.split('.')[1];
      let base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(window.atob(base64));
  }

  isSubscribed() {
      let decoded = this.decodeJwt(this.token);
      return decoded && decoded.authorities && decoded.authorities.indexOf('ROLE_HIT_SUBSCRIBER') != -1;
  }

  handleResendConfirmation(submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'api/users/register/resend',
          "email=" + this.login.username, options)
        .subscribe(
          (res) => {
            submitHandler(res.text());
          },
          error => errorHandler
        );
  }

  handleVerify(code: string, submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'api/users/register/verify',
          "code=" + code, options)
        .subscribe(
          (res) => {
            console.log("handleVerify", res);
            submitHandler(res.text());
          },
          (error) => {
            console.log("handleVerify error", error);
            errorHandler(error);
          }
        );
  }

  handleForgotPassword(email: string, submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'api/users/forgot',
          "email=" + email, options)
        .subscribe(
          (res) => {
            submitHandler(res.text());
          },
          error => errorHandler
        );
  }

  handleResetVerify(code: string, submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
      let options = new RequestOptions({ headers: headers });
      return this._http.post(environment.AUTH_ENDPOINT + 'api/users/reset',
          "code=" + code, options)
        .subscribe(
          (res) => {
            submitHandler("");
          },
          error => errorHandler
        );
  }

  handleResetConfirm(submitHandler, errorHandler) {
      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' });
      let options = new RequestOptions({ headers: headers });
      return this._http.put(environment.AUTH_ENDPOINT + 'api/users/reset',
          jQuery["param"](this.reset), options)
        .subscribe(
          (res) => {
            submitHandler(res.text());
          },
          error => errorHandler
        );
  }

  getUserData(errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.get(environment.AUTH_ENDPOINT + 'api/me', { headers: headers })
      .subscribe(
        res => {
          let data:any = res.json();
          this.user = data;
          console.log("Setting user data", this.user);
        },
        error => errorHandler
      );
  }

  checkCustomerInfo(resultHandler, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.post(environment.AUTH_ENDPOINT + 'api/users/subscribe/check', '', {
      headers: headers
    })
      .subscribe(
        res => {
          let needsInfo = 204 == res["status"];
          resultHandler(!needsInfo);
        },
        error => errorHandler
      );
  }

  initCustomerInfo(firstName, lastName, companyName, resultHandler, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.post(environment.AUTH_ENDPOINT + 'api/users/subscribe/customer?first=' + firstName + '&last=' + lastName + '&company=' + companyName, '', {
      headers: headers
    })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            resultHandler();
          } else {
            errorHandler('Response status ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  initHostedPage(resultHandler, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.post(environment.AUTH_ENDPOINT + 'api/users/subscribe/checkout', '', {
      headers: headers
    })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            resultHandler(res.text());
          } else {
            errorHandler('Response status ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  navigateToLogin() {
    // Go to login while refreshing, for now
    (<any> window).location = "/login";
//    this.router.navigate(['/login']);
  }

  recoverAuthTokenFromLocalStorage() {
    this.token = (<string>this.localStorageService.get("auth-token")) || null;

    if (!!this.token) {
      if (!this.isSubscribed()) {
        this.handleLogout();
        this.navigateToLogin();
        return;
      }

      console.log('Recovering and verifying stored auth token..');

      // We're grabbing a stored auth token from the local storage, we must verify that it has not yet expired
      this._http.get(environment.AUTH_ENDPOINT + 'api/me', { headers: new Headers({ "Authorization": "Bearer" + this.token }) })
        .subscribe(
          res => {
            if (401 == res["status"]) {
              console.warn('Stored token expired; implicit logout.');
              this.handleLogout();
              this.navigateToLogin();
            } else {
              console.log('Stored token is still valid.');
              this.lastTokenCheck = Date.now();
            }
          },
          error => {
            console.error('Error checking stored token status; logout.', error);
            this.handleLogout();
            this.navigateToLogin();
          }
        );
    }
  }

  checkTokenOnPageNavigation() {
    if (!this.isAuthenticated()) {
      return;
    }

    let n = Date.now();

    if (n - 300000 < this.lastTokenCheck) {
      return;
    }

    this._http.get(environment.AUTH_ENDPOINT + 'api/me', { headers: new Headers({ "Authorization": "Bearer" + this.token }) })
      .subscribe(
        res => {
          if (401 == res["status"]) {
            console.warn('Stored token expired; implicit logout.');
            this.handleLogout();
            this.navigateToLogin();
          } else {
            console.log('Stored token is still valid.');
            this.lastTokenCheck = Date.now();
          }
        },
        error => {
          console.error('Error checking stored token status; logout.', error);
          this.handleLogout();
          this.navigateToLogin();
        }
      );
  }

  isAuthenticated() {
    if (!this.token) {
      this.recoverAuthTokenFromLocalStorage();
    }

    return !!this.token;
  }

  getToken() {
    if (!this.token) {
      this.recoverAuthTokenFromLocalStorage();
    }

    return this.token;
  }

  handleLogout() {
    this.token = null;
    this.lastTokenCheck = 0;
    this.localStorageService.clearAll('');
  }

  accountForm() {
    // TODO
  }

  handleSubscribe(source, successHandler, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    let options = new RequestOptions({ headers: headers });

    return this._http.post(environment.AUTH_ENDPOINT + 'api/users/customer/hit?source=' + source, 'source=' + source, options)
      .subscribe(
        res => {
          console.log("subscription: " + res);
          console.log("subscription result text: " + res.text());
          successHandler();
        },
        error => errorHandler
      );
  }

  getProfileData(successHandler, errorHandler) {
    console.log(this.user);
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.get(environment.AUTH_ENDPOINT + 'api/users/profile', {
      headers: headers
    })
      .subscribe(
        res => {
          let data:any = res.json();
          this.profile = data;
          this.profile.licensesArray = this.profile.licenses.split(",");
          successHandler();
          console.log("Setting profile", this.profile);
        },
        error => errorHandler
      );
  }

  saveProfileData(errorHandler) {
      let headers = new Headers({
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + this.getToken()
      });
      let options = new RequestOptions({ headers: headers });
      let data = Object.assign({}, this.profile);

      if ("" === this.profile.password) {
        delete this.profile.password;
        delete this.profile.confirmpassword;
      } else {
        delete this.profile.confirmpassword;
      }

      if (data.kartra) {
        delete data.kartra;
      }

      this.profile.licensesArray = this.profile.licensesArray.filter((license) => {
        return ("" !== license);
      });

      this.profile.licenses = "," + this.profile.licensesArray.join(",") + ",";
      delete this.profile.licensesArray;

      return this._http.post(environment.API_ENDPOINT + 'api/users/profile',
        JSON.stringify(data), options)
        .subscribe(
          res => {
            // TODO
          },
          error => errorHandler
        );
  }

  getCheckedEntity() {
    switch (this.contract.purchaseAgency) {
      case "self":
        return this.contract.personalName;
      case "couple":
        return this.contract.spouseName;
      case "corporation":
        return this.contract.corpName;
      case "llc":
        return this.contract.llcName;
      case "1031exchange":
        return this.contract.exchangeName;
    }
    return "";
  }

  getHomeWarrantyServiceProviders() {
    this.homeWarrantyServiceProviders = [
      {"label": "American Home Shield", "value": "American Home Shield"},
      {"label": "First American", "value": "First American"},
      {"label": "Select Home Warranty", "value": "Select Home Warranty"}
    ];
  }

  getAccountData(errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.token});
    return this._http.get(environment.AUTH_ENDPOINT + 'api/me', {
      headers: headers
    })
      .subscribe(
        res => {
          let data:any = res.json();
          this.profile = data;
          console.log("Setting profile", this.profile);
        },
        error => errorHandler
      );
  }

  saveAccountData(data, errorHandler) {
      let headers = new Headers({
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + this.getToken()
      });
      let options = new RequestOptions({ headers: headers });
      let method = ("undefined" !== typeof data.id) ? "put" : "post";
      return this._http[method](environment.API_ENDPOINT + 'account',
        JSON.stringify(data), options)
        .subscribe(
          res => {
            // TODO
          },
          error => errorHandler
        );
  }

  getContractDetails(successHandler, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});
    return this._http.get(environment.AUTH_ENDPOINT + 'api/users/profile/contract', { headers: headers })
      .subscribe(
        res => {
          let data:any = res.json();
          this.contractDetails = data;
          successHandler(data);
        },
        error => errorHandler
      );
  }

  saveContractDetails(data, errorHandler) {
    let headers = new Headers({
      'Content-Type': 'application/json',
      "Authorization": "Bearer " + this.getToken()});
    return this._http.post(environment.AUTH_ENDPOINT + 'api/users/profile/contract/update',
      JSON.stringify(data), new RequestOptions({ headers: headers }))
      .subscribe(res => {}, error => errorHandler);
  }

  saveContractDocument(documentType: string, file: FileList, successHandler, errorHandler) {
    if (file.length < 1) {
      return;
    }

    let headers = new Headers({"Authorization": "Bearer " + this.getToken()});

    const formData: FormData = new FormData();
    formData.append('document', documentType);
    formData.append('file', file.item(0));

    this._http.post(environment.AUTH_ENDPOINT + 'api/users/profile/contract/document', formData, { headers: headers })
      .subscribe(res => {
        if (successHandler) {
          successHandler(Number(res.text()));
        }
      }, error => errorHandler);
  }
}
