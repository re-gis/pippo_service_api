import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { BoundingRectClass, IEventSlideAble } from '../plugins/slideable.directive';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { Observable } from 'rxjs/Rx';
import { NgbTabsetService } from '../ui/index';
import * as moment from 'moment/moment';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-flip',
  templateUrl: 'property-flip.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyFlipComponent implements OnInit, DoCheck {
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
  private defaultRoiPct: number = 30;
  private forceRoi: any;
  private quickView: boolean = false;
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
    this.propertyService.getPropertyFlipListPriceTypes();
    this.sub = this.route.params.subscribe(params => {
      this.bippoId = this.propertyService.parsePropertyId(params['addr']);

      this.notesService.getFlip(this.bippoId, data => this.loadFlipRevision(data), (error, caught) => {
        console.log('Failed to load flip data', error);
      });

      this.viewTab();
    });
  }

  protected viewTab() {
    if (this._active && this.bippoId) {
/*      this.propertyService.getPropertyFlipData(this.bippoId, () => {
          this.propertyService.generatePropertyFlipDeps();
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.propertyService.getPropertyRevisions(this.bippoId, 'flip', 0, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.propertyService.generatePropertyFlipDeps();
      this.generatePropertyFlipDeps();*/
    }
  }

  protected generatePropertyFlipDeps() {
    let self = this;
    if (this.propertyService.property && (Object.keys(this.propertyService.property).length > 0)) {
      this.propertyService.generatePropertyFlipDeps();
    } else {
      setTimeout(function() {
        self.generatePropertyFlipDeps();
      }, 100);
    }
  }

  public revertRevision(revision: any) {
      this.propertyService.revertRevision(revision.id, 'flip', (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
  }

  selectClosingCostType(purchaseClosingCostSelected: string) {
    this.propertyService.propertyFlip.purchaseClosingCost.retainProfit = true;
    this.propertyService.propertyFlip.purchaseClosingCost.selected = purchaseClosingCostSelected;
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

  public handleChangeProfitSlider(event) {
    if (event && event.srcElement) {
      this.propertyService.adjustProfitByPct(this.propertyService.propertyFlipData.roiSliderPrecent = +event.srcElement.value);
    }
  }

  public handleFixProfitSlider(event) {
    this.propertyService.fixProfit();
  }

  public handleChangeProfit(event: IEventSlideAble) {
    this.propertyService.adjustProfitByPct(event.relativePercentHorisontal);
  }

  public handleFixProfitPercent(event: IEventSlideAble) {
    this.propertyService.fixProfit();
  }

  public ngDoCheck() {
    this.propertyService.updatePropertyFlipTotals();

    if (this.forceRoi) {
      for (let i = 0; i < 6; i++) {
        let newProfit = this.forceRoi * (this.propertyService.propertyFlipData.maxBid + this.propertyService.propertyFlipData.costToFlip);

        if (newProfit < 0) {
          newProfit = 0;
        }

        this.propertyService.propertyFlip.profit = newProfit;
        this.propertyService.updatePropertyFlipTotals();
        this.propertyService.fixProfit();
      }

      this.forceRoi = null;
    }
  }

  loadFlipDefault(rev) {
    console.log('Loading default flip', rev);

    if (rev.purchaseClosingCost) {
      this.propertyService.propertyFlip.purchaseClosingCost.cash.titleCompanyFees = rev.purchaseClosingCost.titleCompanyFees;
      this.propertyService.propertyFlip.purchaseClosingCost.financed.titleCompanyFees = rev.purchaseClosingCost.titleCompanyFees;
      this.propertyService.propertyFlip.purchaseClosingCost.cash.titleCompanyEscrowFees = rev.purchaseClosingCost.titleCompanyEscrowFees;
      this.propertyService.propertyFlip.purchaseClosingCost.financed.titleCompanyEscrowFees = rev.purchaseClosingCost.titleCompanyEscrowFees;
      this.propertyService.propertyFlip.purchaseClosingCost.cash.insurance = rev.purchaseClosingCost.insurance;
      this.propertyService.propertyFlip.purchaseClosingCost.financed.insurance = rev.purchaseClosingCost.insurance;
      this.propertyService.propertyFlip.purchaseClosingCost.cash.survey = rev.purchaseClosingCost.survey;
      this.propertyService.propertyFlip.purchaseClosingCost.financed.survey = rev.purchaseClosingCost.survey;
//      this.propertyService.propertyFlip.purchaseClosingCost.financed.loanOrigination = rev.purchaseClosingCost.loanOrigination;
      this.propertyService.propertyFlip.purchaseClosingCost.financed.loanDownPaymentFraction = rev.purchaseClosingCost.loanDownPayment / 100.0;
    }

    if (rev.expenses) {
      this.propertyService.propertyFlip.expenses.months = rev.expenses.months;
      this.propertyService.propertyFlipData.expenses.insurance = rev.expenses.insurance;
      this.propertyService.propertyFlipData.expenses.utilityCosts.other = rev.expenses.utilities;
    }

    if (rev.sellingClosingCost) {
      this.propertyService.propertyFlip.sellingClosingCost.titleCompanyFees = rev.sellingClosingCost.titleCompany;
      this.propertyService.propertyFlip.sellingClosingCost.miscLender = rev.sellingClosingCost.miscLender;
      this.propertyService.propertyFlip.sellingClosingCost.other = rev.sellingClosingCost.other;
      this.propertyService.propertyFlip.sellingClosingCost.realEstateCommission = rev.sellingClosingCost.commission / 100.0;
    }
  }

  loadFlipRevision(rev) {
    if (rev && rev.hasOwnProperty('details')) {
      rev = rev.details;
    }

    if (rev) {
      if (rev.isDefault) {
        this.loadFlipDefault(rev);

        return;
      }

      console.log('Loading saved flip', rev);

      if (rev.purchaseClosingCost) {
        Object.assign(this.propertyService.propertyFlip.purchaseClosingCost.cash, rev.purchaseClosingCost);
        Object.assign(this.propertyService.propertyFlip.purchaseClosingCost.financed, rev.purchaseClosingCost);
        this.setTitlePolicy(rev.purchaseClosingCost.titlePayer == 1 ? true : false);
        this.propertyService.propertyFlip.purchaseClosingCost.financed.loanDownPaymentFraction = rev.purchaseClosingCost.loanDownPayment / 100.0;
      }

      if (rev.expenses) {
        Object.assign(this.propertyService.propertyFlipData.expenses, rev.expenses);
        this.propertyService.propertyFlipData.expenses.utilityCosts.other = rev.expenses.utilities;
      }

      if (rev.sellingClosingCost) {
        Object.assign(this.propertyService.propertyFlip.sellingClosingCost, rev.sellingClosingCost);
        this.propertyService.propertyFlip.sellingClosingCost.titleCompanyFees = rev.sellingClosingCost.titleCompany;
      }

      this.propertyService.propertyFlip.purchaseClosingCost.selected = rev.fundingSource != 1 ? 'cash' : 'financed';

      switch (rev.resaleSource) {
        case 1:
          this.propertyService.propertyCommon.market.type = 'asIs';
          break;
        case 2:
          this.propertyService.propertyCommon.market.type = 'other';
          break;
        default:
          this.propertyService.propertyCommon.market.type = 'arv';
          break;
      }

      this.propertyService.propertyCommon.market.otherValue = Number(rev.resaleCustom) || 0;
      this.propertyService.propertyFlipData.repairRemodelType = rev.repairSource == 1 ? 'rrCustom' : 'rrHit';
      this.propertyService.propertyFlipData.repairRemodelCustomTotal = Number(rev.repairCustom) || 0;

      if (rev.display) {
        this.propertyService.adjustProfitExplicitly(Number(rev.display.substring(0, rev.display.indexOf(' ')).replaceAll(/\W/g, '')) || 0);
      } else {
        this.propertyService.propertyFlipData.roi = (Number(rev.roi) || 10) / 100.0;
      }

//      this.propertyService.adjustProfitByPct(this.propertyService.propertyFlipData.roiSliderPrecent = Number(rev.roi) || 10);
//      this.propertyService.fixProfit();
    }
  }

  saveFlipRevision() {
    if (this.saving) {
      return;
    }

    this.saving = true;

    let save = {
      purchaseClosingCost: {
        titlePayer: this.titlePolicyParty != 'sellerPays' ? 1 : 0,
        loanDownPayment: this.propertyService.propertyFlip.purchaseClosingCost.financed.loanDownPaymentFraction * 100
      },
      expenses: {
        utilities: this.propertyService.propertyFlipData.expenses.utilityCosts.other
      },
      sellingClosingCost: {},
      roi: Math.round(this.propertyService.propertyFlipData.roi * 1000) / 10,
      display: '$' + this.propertyService.propertyFlip.profit.toLocaleString() + ', ' + this.propertyService.propertyFlipData.ROIFormatted + ' ROI',
      fundingSource: this.propertyService.propertyFlip.purchaseClosingCost.selected != 'cash' ? 1 : 0,
      resaleSource: 0,
      resaleCustom: this.propertyService.propertyCommon.market.otherValue,
      repairSource: this.propertyService.propertyFlipData.repairRemodelType != 'rrHit' ? 1 : 0,
      repairCustom: this.propertyService.propertyFlipData.repairRemodelCustomTotal
    };

    if (this.propertyService.propertyCommon.market.type) {
      switch (this.propertyService.propertyCommon.market.type) {
        case 'asIs':
          save.resaleSource = 1;
          break;
        case 'other':
          save.resaleSource = 2;
          break;
      }
    }

    Object.assign(save.purchaseClosingCost, this.propertyService.propertyFlip.purchaseClosingCost.financed);

    if (this.propertyService.propertyFlip.purchaseClosingCost.selected == 'cash') {
      Object.assign(save.purchaseClosingCost, this.propertyService.propertyFlip.purchaseClosingCost.cash);
    }

    Object.assign(save.expenses, this.propertyService.propertyFlipData.expenses);
    Object.assign(save.sellingClosingCost, this.propertyService.propertyFlip.sellingClosingCost);

    this.notesService.postFlip(this.bippoId, save,
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
    return Math.floor(this.propertyService.propertyFlip.purchaseClosingCost.financed.loanDownPaymentFraction * this.propertyService.propertyFlipData.startingBid);
  }

  getRealEstateCommDollars() {
    return Math.floor(this.propertyService.propertyFlip.sellingClosingCost.realEstateCommission * this.propertyService.property.market.arv);
  }

  setTitlePolicy(buyerPay) {
    if (this.propertyService.propertyFlip.purchaseClosingCost.buyerPays = !!buyerPay) {
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
