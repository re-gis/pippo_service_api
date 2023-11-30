import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { BoundingRectClass, IEventSlideAble } from 'ng2-slideable-directive/slideable.directive';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { NgbTabsetService } from '../ui/index';
import { Observable } from 'rxjs/Rx';
import * as moment from 'moment/moment';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-rent',
  templateUrl: 'property-rent.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyRentComponent implements OnInit, DoCheck {
  private _active: boolean;
  @Input()
  set active(active: boolean) {
    this._active = active;
    this.viewTab();
  }
  propertyService: PropertyService;
  searchService: SearchService;
  private sub: any;
  private bippoId: string;
  coctab: string = "tab-cash";
  private defaultRoiPct: number = 10;
  private forceRoi: any;
  private titlePolicyParty: string = 'sellerPays';
  private saving: boolean = false;
  private saved: boolean = false;

  constructor(private route: ActivatedRoute,
        propertyService: PropertyService,
        searchService: SearchService,
        private notesService: NotesService,
        private tabsetService: NgbTabsetService) {
    this.propertyService = propertyService;
    this.searchService = searchService;
  }

  ngOnInit() {
    this.forceRoi = this.defaultRoiPct / 100.0;
    this.bippoId = null;
    this.propertyService.getPropertyRentListPriceTypes();
    this.propertyService.getPropertyRentPriceTypes();
    this.sub = this.route.params.subscribe(params => {
      this.bippoId = this.propertyService.parsePropertyId(params['addr']);

      this.notesService.getHold(this.bippoId, data => this.loadHoldRevision(data), (error, caught) => {
        console.log('Failed to load hold data', error);
      });

      this.viewTab();
    });
  }

  viewTab() {
    if (this._active && this.bippoId) {
/*      this.propertyService.getPropertyRentData(this.bippoId, () => {
        this.propertyService.generatePropertyRentDeps();
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.getPropertyRevisions(this.bippoId, 'rent', (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.propertyService.generatePropertyRentDeps();
      this.generatePropertyRentDeps();*/
    }
  }

  selectCoC(tabname: string, purchaseClosingCostSelected: string) {
    this.coctab = tabname;
    this.propertyService.propertyRent.purchaseClosingCost.retainProfit = true;
    this.propertyService.propertyRent.purchaseClosingCost.selected = purchaseClosingCostSelected;
  }

  protected generatePropertyRentDeps() {
    let self = this;
    if (this.propertyService.property && (Object.keys(this.propertyService.property).length > 0)) {
      this.propertyService.generatePropertyRentDeps();
    } else {
      setTimeout(function() {
        self.generatePropertyRentDeps();
      }, 100);
    }
  }

  public revertRevision(revision: any) {
      this.propertyService.revertRevision(revision.id, 'rent', (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
  }

  public handleChangeProfitSlider(event) {
    if (event && event.srcElement) {
      this.propertyService.adjustRentRoiToPct(this.propertyService.propertyRentData.roiSliderPrecent = +event.srcElement.value);
    }
  }

  public handleFixProfitSlider(event) {
    this.propertyService.fixRentRoi();
  }

  public handleChangeRoi(event: IEventSlideAble) {
    this.propertyService.adjustRentRoiToPct(event.relativePercentHorisontal);
  }

  public handleFixRoi(event: IEventSlideAble) {
    this.propertyService.fixRentRoi();
  }

  public ngDoCheck() {
    this.propertyService.updatePropertyRentTotals();

    if (this.forceRoi) {
      this.propertyService.propertyRent.income.desiredRoi = this.forceRoi;
      this.propertyService.updatePropertyRentTotals();
      this.propertyService.fixRentRoi();
      this.forceRoi = null;
    }
  }

  loadHoldDefault(rev) {
    console.log('Loading default hold', rev);

    if (rev.purchaseClosingCost) {
      this.propertyService.propertyRent.purchaseClosingCost.cash.titleCompanyFees = rev.purchaseClosingCost.titleCompanyFees;
      this.propertyService.propertyRent.purchaseClosingCost.financed.titleCompanyFees = rev.purchaseClosingCost.titleCompanyFees;
      this.propertyService.propertyRent.purchaseClosingCost.cash.titleCompanyEscrowFees = rev.purchaseClosingCost.titleCompanyEscrowFees;
      this.propertyService.propertyRent.purchaseClosingCost.financed.titleCompanyEscrowFees = rev.purchaseClosingCost.titleCompanyEscrowFees;
      this.propertyService.propertyRent.purchaseClosingCost.cash.insurance = rev.purchaseClosingCost.insurance;
      this.propertyService.propertyRent.purchaseClosingCost.financed.insurance = rev.purchaseClosingCost.insurance;
      this.propertyService.propertyRent.purchaseClosingCost.cash.survey = rev.purchaseClosingCost.survey;
      this.propertyService.propertyRent.purchaseClosingCost.financed.survey = rev.purchaseClosingCost.survey;
//      this.propertyService.propertyRent.purchaseClosingCost.financed.loanOrigination = rev.purchaseClosingCost.loanOrigination;
      this.propertyService.propertyRent.purchaseClosingCost.financed.loanDownPaymentFraction = rev.purchaseClosingCost.loanDownPayment / 100.0;
    }

    if (rev.expenses) {
        this.propertyService.propertyRentData.expenses.insurance = rev.expenses.insurance;
        this.propertyService.propertyRentData.expenses.other = rev.expenses.other;
        this.propertyService.propertyRentData.expenses.vacancyRatePercent = rev.expenses.vacancy / 100.0;
        this.propertyService.propertyRentData.expenses.maintenancePercent = rev.expenses.maintenance / 100.0;
        this.propertyService.propertyRentData.expenses.managementPercent = rev.expenses.management / 100.0;
    }
  }

  loadHoldRevision(rev) {
    if (rev && rev.hasOwnProperty('details')) {
      rev = rev.details;
    }

    if (rev) {
      if (rev.isDefault) {
        this.loadHoldDefault(rev);
        return;
      }

      console.log('Loading saved hold', rev);

      if (rev.purchaseClosingCost) {
        Object.assign(this.propertyService.propertyRent.purchaseClosingCost.cash, rev.purchaseClosingCost);
        Object.assign(this.propertyService.propertyRent.purchaseClosingCost.financed, rev.purchaseClosingCost);
        this.setTitlePolicy(rev.purchaseClosingCost.titlePayer == 1 ? true : false);
        this.propertyService.propertyRent.purchaseClosingCost.financed.loanDownPaymentFraction = rev.purchaseClosingCost.loanDownPayment / 100.0;
      }

      if (rev.expenses) {
        Object.assign(this.propertyService.propertyRentData.expenses, rev.expenses);
        this.propertyService.propertyRentData.expenses.vacancyRatePercent = rev.expenses.vacancy / 100.0;
        this.propertyService.propertyRentData.expenses.maintenancePercent = rev.expenses.maintenance / 100.0;
        this.propertyService.propertyRentData.expenses.managementPercent = rev.expenses.management / 100.0;
        this.propertyService.propertyRentData.expenses.mortgage = {
          selected: 'other',
          otherValue: rev.expenses.mortgage
        };
      }

      this.propertyService.propertyRent.purchaseClosingCost.selected = rev.fundingSource != 1 ? 'cash' : 'financed';

      switch (rev.rentSource) {
        case 1:
          this.propertyService.propertyRent.rentType = 'rentb';
          break;
        case 2:
          this.propertyService.propertyRent.rentType = 'other';
          break;
        default:
          this.propertyService.propertyRent.rentType = 'renta';
          break;
      }

      this.propertyService.propertyRent.rent.otherValue = Number(rev.rentCustom) || 0;
      this.propertyService.propertyRentData.repairRemodelType = rev.repairSource == 1 ? 'rrCustom' : 'rrHit';
      this.propertyService.propertyRentData.repairRemodelCustomTotal = Number(rev.repairCustom) || 0;

      this.propertyService.adjustRentRoiToPct(this.propertyService.propertyRentData.roiSliderPrecent = Number(rev.roi) || 10);
    }
  }

  saveHoldRevision() {
    if (this.saving) {
      return;
    }

    this.saving = true;

    let save = {
      purchaseClosingCost: {
        titlePayer: this.titlePolicyParty != 'sellerPays' ? 1 : 0,
        loanDownPayment: this.propertyService.propertyRent.purchaseClosingCost.financed.loanDownPaymentFraction * 100
      },
      expenses: {
        vacancy: 0,
        maintenance: 0,
        management: 0,
        mortgage: 0
      },
      roi: Math.round(this.propertyService.propertyRent.income.desiredRoi * 1000) / 10,
      display: '$' + (this.propertyService.propertyRent.income.net * 12).toLocaleString() + '/yr, ' + this.propertyService.propertyRentData.roiFormatted + ' ROI',
      fundingSource: this.propertyService.propertyRent.purchaseClosingCost.selected != 'cash' ? 1 : 0,
      rentSource: 0,
      rentCustom: this.propertyService.propertyRent.rent.otherValue,
      repairSource: this.propertyService.propertyRentData.repairRemodelType != 'rrHit' ? 1 : 0,
      repairCustom: this.propertyService.propertyRentData.repairRemodelCustomTotal
    };

    if (this.propertyService.propertyRent.rent.type) {
      switch (this.propertyService.propertyRent.rent.type) {
        case 'rentb':
          save.rentSource = 1;
          break;
        case 'other':
          save.rentSource = 2;
          break;
      }
    }

    Object.assign(save.purchaseClosingCost, this.propertyService.propertyRent.purchaseClosingCost.financed);

    if (this.propertyService.propertyRent.purchaseClosingCost.selected == 'cash') {
      Object.assign(save.purchaseClosingCost, this.propertyService.propertyRent.purchaseClosingCost.cash);
    }

    Object.assign(save.expenses, this.propertyService.propertyRent.expenses);
    save.expenses.vacancy = this.propertyService.propertyRent.expenses.vacancyRatePercent * 100;
    save.expenses.maintenance = this.propertyService.propertyRent.expenses.maintenancePercent * 100;
    save.expenses.management = this.propertyService.propertyRent.expenses.managementPercent * 100;
    save.expenses.mortgage = this.propertyService.propertyRent.expenses.mortgage.otherValue;

    this.notesService.postHold(this.bippoId, save,
        () => {
          this.saved = true;
          this.saving = false;
        },
        (error, caught) => {
          this.saved = false;
          this.saving = false;
        });
  }

  public formatTime(timeString: string) {
    return moment(new Date(timeString)).format("MMMM Do, YYYY - h:mm a");
  }

  public percentMask(inputString: string) {
    let numericLength = 0;
    let matchArray: Array<string | RegExp> = [];
    matchArray.push(/\d/);
    for (numericLength = 1; numericLength < inputString.length; numericLength++) {
      if (!/\d/.test(String(inputString[numericLength]))) {
        matchArray.push('%');
        return matchArray;
      } else {
        matchArray.push(/\d/);
      }
    }

    matchArray.push('%');
    return matchArray;
  }

  decimalToPercent(value: number) {
    if (value) {
      return Math.floor(value * 10000) / 100;
    } else {
      return 0;
    }
  }

  decimalPercent(conformedValue: string, config): any {
    let matches = conformedValue.match(/(\d+)\%?/);
    if (matches && (matches.length > 1) && (matches[1].length > 0)) {
      return {value: parseFloat(matches[1]) / 100};
    } else {
      return {value: 0};
    }
  }

  getLoanDownPaymentDollars() {
    return Math.floor(this.propertyService.propertyRent.purchaseClosingCost.financed.loanDownPaymentFraction * this.propertyService.propertyRentData.startingBid);
  }

  selectNextQuality() {
    let quality = this.propertyService.getFlipSelectedQuality();

    if (("undefined" !== typeof quality) && quality > 0 && quality <= 5) {
      this.propertyService.selectQualityScore(quality - 1);
    }
  }

  selectPrevQuality() {
    let quality = this.propertyService.getFlipSelectedQuality();

    if (("undefined" !== typeof quality) && quality >= 0 && quality < 5) {
      this.propertyService.selectQualityScore(quality + 1);
    }
  }

  setTitlePolicy(buyerPay) {
    if (this.propertyService.propertyRent.purchaseClosingCost.buyerPays = !!buyerPay) {
      this.titlePolicyParty = 'buyerPays';
    } else {
      this.titlePolicyParty = 'sellerPays';
    }
  }

  itemHasCost0(item) {
    switch (item.costType) {
      case 'PER_GLA':
      case 'PER_LOT':
      case 'PIECE_COST':
      case 'PER_GLA_2':
      case 'PER_GLA_PC':
        return true;
      default:
        return false;
    }
  }

  itemHasCost1(item) {
    return item.costType == 'PER_GLA_2';
  }

  itemHasSourceUnit(item) {
    switch (item.costType) {
      case 'PER_GLA':
      case 'PER_LOT':
      case 'PER_GLA_2':
        return true;
      default:
        return false;
    }
  }

  itemHasCount(item) {
    switch (item.costType) {
      case 'PIECE_COST':
      case 'PER_GLA_PC':
        return true;
      default:
        return false;
    }
  }
}
