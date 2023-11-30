import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AuthService } from '../auth/auth.service';
import { NotesService } from '../property/notes.service';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-profile',
  templateUrl: 'profile.component.html',
  styleUrls: []
})
export class ProfileComponent implements OnInit {
  authService: AuthService;
  profileTab: string;
  contractTab: number = 0;
  private sub: any;
  showPwError: boolean = false;
  showPwSuccess: boolean = false;
  private displayLicenses: boolean = false;
  private spmModuleSettings: any = [];
//  private spmModuleIndex: any = {};
  private spmSaving: boolean = false;
  private spmSaved: number = -1;
  purchaseCostPresets: any = {
    titleCompanyFees: '$450',
    titleCompanyEscrowFees: '$500',
    insurance: '$50',
    survey: '$0',
    loanOrigination: '1%',
    loanDownPayment: '10%'
  };
  holdingCostPresets: any = {
    months: '3',
    insurance: '$50',
    utilities: '$0',
    other: '$0',
    vacancy: '5%',
    maintenance: '3%',
    management: '0%'
  };
  sellingCostPresets: any = {
    titleCompany: '$450',
    miscLender: '$0',
    other: '$0',
    commission: '4.5%'
  };
  private flipSaving: boolean = false;
  private holdSaving: boolean = false;
  private flipHoldSaved: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    authService: AuthService,
    private notesService: NotesService
  ) {
    this.authService = authService;
    console.log("Init profile component!");
  }

  ngOnInit() {
    this.profileTab = "profile";
    this.authService.getHomeWarrantyServiceProviders();

    this.sub = this.route.params.subscribe(params => {
        if (("undefined" !== typeof params["section"]) && ("" !== params["section"])) {
          this.profileTab = params["section"];
        }
      });
    this.authService.getProfileData(() => {
        if ("" === this.authService.profile.licenses) {
          this.displayLicenses = true;
        }
      }, (error: any, caught: Observable<any> = undefined) => {
        console.log('Error getting profile data', error);
        return caught;
      });
    this.authService.getContractDetails(data => {
      this.authService.contract = data;
    }, (error, caught) => {
        console.log('Error getting contract details', error);
      });
    this.notesService.getFlip('null', data => {
        this.loadFromFlipPreset(data);
      }, (error, caught) => {});
    this.notesService.getHold('null', data => {
        this.loadFromHoldPreset(data);
      }, (error, caught) => {});
    this.notesService.loadSpreadsheetSettings(["Repair Calculator"], data => this.loadSpmSettings(data), (error, caught) => {});
  }

  onSubmitSelfBilling() {
    (<any> window).open('https://www.homeinvestortool.com/billing-portal');
  }

  onSubmitResetPass() {
    this.authService.handleForgotPassword(this.authService.profile.email, () => {
      this.showPwError = false;
      this.showPwSuccess = true;
    }, (error: any, caught: Observable<any> = undefined) => {
      console.log(error);
      this.showPwError = true;
      this.showPwSuccess = false;
      return caught;
    });
  }

  onSubmit() {
    this.authService.saveProfileData((error: any, caught: Observable<any> = undefined) => {
      console.log(error);
      return caught;
    });
  }

  onCellphoneChange(event) {
    let r = event.match(/\d+/g);
    this.authService.contract.cellPhone = r ? r.join("").replace(/(\d{3})\-?(\d{3})\-?(\d{4})/,'$1-$2-$3') : '';
  }

  onOfficePhoneChange(event) {
    let r = event.match(/\d+/g);
    this.authService.contract.officePhone = r ? r.join("").replace(/(\d{3})\-?(\d{3})\-?(\d{4})/,'$1-$2-$3') : '';
  }

  fileChange(event, documentType) {
    let fileList: FileList = event.target.files;
    this.authService.saveContractDocument(documentType, fileList,
      b => {
        if (b) {
          console.log('Uploaded ' + documentType + ' @ ' + b + 'B');

          switch (documentType) {
            case 'CORP_CHARTER':
              this.authService.contract.corpCharterSize = b;
              break;
            case 'CORP_SIGNATORY':
              this.authService.contract.corpSignatorySize = b;
              break;
            case 'LLC_FORMATION':
              this.authService.contract.llcFormationSize = b;
              break;
            case 'LLC_SIGNATORY':
              this.authService.contract.llcSignatorySize = b;
              break;
          }
        }
      },
      (error: any, caught: Observable<any> = undefined) => {
        console.log(error);
        return caught;
    });
  }

  deleteFlipHoldPresets() {
    this.flipSaving = true;
    this.holdSaving = true;
    this.flipHoldSaved = false;

    this.notesService.postFlip('', null, () => {
        this.flipSaving = false;
      }, (error, caught) => {
        this.flipSaving = false;
      });
    this.notesService.postHold('', null, () => {
        this.holdSaving = false;
      }, (error, caught) => {
        this.flipSaving = false;
      });
  }

  loadFromFlipPreset(data) {
    if (data && data.details) {
      data = data.details;
    }

    if (data && data.purchaseClosingCost) {
      this.purchaseCostPresets.titleCompanyFees = '$' + data.purchaseClosingCost.titleCompanyFees;
      this.purchaseCostPresets.titleCompanyEscrowFees = '$' + data.purchaseClosingCost.titleCompanyEscrowFees;
      this.purchaseCostPresets.insurance = '$' + data.purchaseClosingCost.insurance;
      this.purchaseCostPresets.survey = '$' + data.purchaseClosingCost.survey;
      this.purchaseCostPresets.loanOrigination = data.purchaseClosingCost.loanOrigination + '%';
      this.purchaseCostPresets.loanDownPayment = '$' + data.purchaseClosingCost.loanDownPayment;
    }

    if (data && data.expenses) {
      this.holdingCostPresets.months = data.expenses.months;
      this.holdingCostPresets.insurance = '$' + data.expenses.insurance;
      this.holdingCostPresets.utilities = '$' + data.expenses.utilities;
    }

    if (data && data.sellingClosingCost) {
      this.sellingCostPresets.titleCompany = '$' + data.sellingClosingCost.titleCompany;
      this.sellingCostPresets.miscLender = '$' + data.sellingClosingCost.miscLender;
      this.sellingCostPresets.other = '$' + data.sellingClosingCost.other;
      this.sellingCostPresets.commission = (Math.floor(Number(data.sellingClosingCost.commission) * 10) / 10) + '%';
    }
  }

  loadFromHoldPreset(data) {
    if (data && data.details) {
      data = data.details;
    }

    if (data && data.purchaseClosingCost) {
      this.purchaseCostPresets.titleCompanyFees = '$' + data.purchaseClosingCost.titleCompanyFees;
      this.purchaseCostPresets.titleCompanyEscrowFees = '$' + data.purchaseClosingCost.titleCompanyEscrowFees;
      this.purchaseCostPresets.insurance = '$' + data.purchaseClosingCost.insurance;
      this.purchaseCostPresets.survey = '$' + data.purchaseClosingCost.survey;
      this.purchaseCostPresets.loanOrigination = data.purchaseClosingCost.loanOrigination + '%';
      this.purchaseCostPresets.loanDownPayment = '$' + data.purchaseClosingCost.loanDownPayment;
    }

    if (data && data.expenses) {
      this.holdingCostPresets.insurance = '$' + data.expenses.insurance;
      this.holdingCostPresets.other = '$' + data.expenses.other;
      this.holdingCostPresets.vacancy = data.expenses.vacancy + '%';
      this.holdingCostPresets.maintenance = data.expenses.maintenance + '%';
      this.holdingCostPresets.management = data.expenses.management + '%';
    }
  }

  saveFlipHoldPresets() {
    let purchaseClosingCost = {
      titleCompanyFees: Math.floor(Number(this.purchaseCostPresets.titleCompanyFees.replaceAll(/[^\d.,]+/g, '')) || 0),
      titleCompanyEscrowFees: Math.floor(Number(this.purchaseCostPresets.titleCompanyEscrowFees.replaceAll(/[^\d.,]+/g, '')) || 0),
      insurance: Math.floor(Number(this.purchaseCostPresets.insurance.replaceAll(/[^\d.,]+/g, '')) || 0),
      survey: Math.floor(Number(this.purchaseCostPresets.survey.replaceAll(/[^\d.,]+/g, '')) || 0),
      loanOrigination: Math.floor((Number(this.purchaseCostPresets.loanOrigination.replaceAll(/[^\d.,]+/g, '')) || 0) * 10),
      loanDownPayment: Number(this.purchaseCostPresets.loanDownPayment.replaceAll(/[^\d.,]+/g, '')) || 0
    };
    let flipHoldingCost = {
      months: Math.floor(Number(this.holdingCostPresets.months.replaceAll(/[^\d.,]+/g, '')) || 0),
      insurance: Math.floor(Number(this.holdingCostPresets.insurance.replaceAll(/[^\d.,]+/g, '')) || 0),
      utilities: Math.floor(Number(this.holdingCostPresets.utilities.replaceAll(/[^\d.,]+/g, '')) || 0)
    };
    let holdExpenses = {
      insurance: Math.floor(Number(this.holdingCostPresets.insurance.replaceAll(/[^\d.,]+/g, '')) || 0),
      other: Math.floor(Number(this.holdingCostPresets.other.replaceAll(/[^\d.,]+/g, '')) || 0),
      vacancy: Number(this.holdingCostPresets.vacancy.replaceAll(/[^\d.,]+/g, '')) || 0,
      maintenance: Number(this.holdingCostPresets.maintenance.replaceAll(/[^\d.,]+/g, '')) || 0,
      management: Number(this.holdingCostPresets.management.replaceAll(/[^\d.,]+/g, '')) || 0,
    };
    let sellingClosingCost = {
      titleCompany: Math.floor(Number(this.sellingCostPresets.titleCompany.replaceAll(/[^\d.,]+/g, '')) || 0),
      miscLender: Math.floor(Number(this.sellingCostPresets.miscLender.replaceAll(/[^\d.,]+/g, '')) || 0),
      other: Math.floor(Number(this.sellingCostPresets.other.replaceAll(/[^\d.,]+/g, '')) || 0),
      commission: Number(this.sellingCostPresets.commission.replaceAll(/[^\d.,]+/g, '')) || 0,
    };

    this.flipSaving = true;
    this.holdSaving = true;
    this.flipHoldSaved = false;

    this.notesService.postFlip('', {
        purchaseClosingCost: purchaseClosingCost,
        expenses: flipHoldingCost,
        sellingClosingCost: sellingClosingCost
      }, () => {
        this.flipSaving = false;
        this.flipHoldSaved = true;
      }, (error, caught) => {
        this.flipSaving = false;
      });
    this.notesService.postHold('', {
        purchaseClosingCost: purchaseClosingCost,
        expenses: holdExpenses
      }, () => {
        this.holdSaving = false;
        this.flipHoldSaved = true;
      }, (error, caught) => {
        this.holdSaving = false;
      });
  }

  submitContract() {
    this.authService.saveContractDetails(this.authService.contract,
      (error: any, caught: Observable<any> = undefined) => {
        console.log(error);
        return caught;
    });
  }

  setProfileTab(tab: string) {
    this.profileTab = tab;
  }

  loadSpmSettings(data) {
    for (let m of data.modules) {
      m.defaultData = (m.defaultData ? JSON.parse(m.defaultData) : null) || {};
      m.userData = (m.userData ? JSON.parse(m.userData) : null) || {};
      m.userDataLayout = (m.userDataLayout ? JSON.parse(m.userDataLayout) : null) || [];

      for (let entry of (<any> window).Object.entries(m.defaultData)) {
        m.defaultData[entry[0]] = this.trimDollars(String(entry[1]));
      }

      for (let entry of (<any> window).Object.entries(m.userData)) {
        m.userData[entry[0]] = this.trimDollars(String(entry[1]));
      }

      let udTabs = [];
      let udHeaders = {};
      let udRows = {};

      for (let tab of m.userDataLayout) {
        udTabs.push(tab[0]);
        udHeaders[tab[0]] = tab[1];
        udRows[tab[0]] = tab.slice(2).map(d => {
          let l = null;
          let sl = null;

          if (d[0].indexOf('|') < 0) {
            l = d[0];
          } else {
            let split = d[0].split('|');
            l = split[0];
            sl = split[1];
          }

          return { label: l, sublabel: sl, fields: d.slice(1) };
        });
      }

      m.userDataTabs = udTabs;
      m.userDataTabSelected = udTabs[0] || null;
      m.userDataHeaders = udHeaders;
      m.userDataRows = udRows;
    }

    this.spmModuleSettings = data.modules;
    console.log('Load SPM', this.spmModuleSettings);
  }

  unsetSpmSetting(module, item) {
    if (item) {
      delete module.userData[item];
    }
  }

  saveSpmSettings(module) {
    if (this.spmSaving) {
      return;
    }

    this.spmSaved = -1;
    this.spmSaving = true;

    let formattedData = {};

    for (let entry of (<any> window).Object.entries(module.userData)) {
      formattedData[entry[0]] = this.trimNumber(entry[1]);
    }

    this.notesService.saveSpreadsheetSetting(module.moduleTitle, formattedData, () => {
      this.spmSaved = module.moduleId;
      this.spmSaving = false;
    }, (error, caught) => {
      console.warn('Error saving SPM', error);
      this.spmSaving = false;
    });
  }

  deleteSpmSettings(module) {
    module.userData = {};
    this.saveSpmSettings(module);
  }

  trimNumber(n) {
    return n.replaceAll(/[^\d.,]+/g, '');
  }

  trimDollars(n) {
    return '$' + n.replaceAll(/[^\d.,]+/g, '');
  }

  trimPercent(n) {
    return n.replaceAll(/[^\d.,]+/g, '') + '%';
  }

  logout() {
    this.authService.handleLogout();
    this.router.navigate(['/login']);
  }
}
