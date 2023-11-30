import { Component, OnInit, OnDestroy, Input, DoCheck } from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { BoundingRectClass, IEventSlideAble } from '../plugins/slideable.directive';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { Observable } from 'rxjs/Rx';
import * as moment from 'moment/moment';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-repairs',
  templateUrl: 'property-repairs.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyRepairsComponent implements OnInit, OnDestroy, DoCheck {
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
  private forceRoi: any;
  private editPhotos: boolean = false;
  private categoryDisplay: any = [];
  private showQualityDetails: boolean = false;
  private rrVisible: boolean = true;
  private savedRepair: any = null;
  private savedRemodel: any = null;

  private spmLoaded: any = null;
  private spmInputCallback: any = null;
  private spmOutputCallback: any = null;
  private spmExportCallback: any = null;
  private spmToolbarCallback: any = null;
  private spmSaving: boolean = false;
  private spmSaved: number = 0;

  constructor(private route: ActivatedRoute,
        propertyService: PropertyService,
        searchService: SearchService,
        private notesService: NotesService) {
    this.propertyService = propertyService;
    this.searchService = searchService;
  }

  ngOnInit() {
    // This pubsub logic could be extracted to a service but it should be generalized more..
    window['spmLoaded'] = (submitInputCallback, requestOutputCallback, exportCsvCallback, toolbarCallback) => {
      this.spmInputCallback = submitInputCallback;
      this.spmOutputCallback = requestOutputCallback;
      this.spmExportCallback = exportCsvCallback;
      this.spmToolbarCallback = toolbarCallback;

      submitInputCallback(
          this.spmLoaded.spreadsheetBase,
          this.spmLoaded.spreadsheetLive,
          this.flattenProperty({}, this.propertyService.getCurrentProperty()),
          JSON.parse(this.spmLoaded.userData),
          JSON.parse(this.spmLoaded.defaultData),
          JSON.parse(this.spmLoaded.enumTable));
    };
    window['spmOutput'] = (key, value) => {
      if (key == 'total') {
        this.propertyService.propertyFlipData.repairRemodelTotal = Number(value);
      }
    };
    window['spmExport'] = (csv, csvClean) => {
      if (this.spmOutputCallback) {
        this.spmExportSave(csv, csvClean, this.spmOutputCallback());
      }
    };

    this.forceRoi = .1;
    this.bippoId = null;
    this.sub = this.route.params.subscribe(params => {
      this.bippoId = this.propertyService.parsePropertyId(params['addr']);

      this.notesService.getRR(this.bippoId, data => {
        console.log('Loaded Repair/Remodel: ', data);

        if (data && data.details) {
          this.loadRevision(data.details.repair, data.details.remodel);
        }
      }, (error, caught) => {
        console.log('Error loading Repair/Remodel: ' + error);
      });
      this.notesService.loadSpreadsheetModule(this.bippoId, "Repair Calculator", data => {
        this.spmLoaded = data;
      }, (error, caught) => {
        console.log('Error loading SPM repairs', error);
      });

      this.viewTab();
    });
  }

  ngOnDestroy() {
    delete window['spmLoaded'];
    delete window['spmOutput'];
    delete window['spmExport'];
    this.spmInputCallback = null;
    this.spmOutputCallback = null;
  }

  protected viewTab() {
    if (this._active && this.bippoId) {
      this.propertyService.cleanAndRecalcFlipRepairs();
//      this.applyRevision();
    }
  }

  private spmExportSave(csv, csvClean, outputs) {
    if (this.spmSaving) {
      return;
    }

    this.spmSaving = true;

    this.notesService.saveSpreadsheetModule(this.bippoId, "Repair Calculator", csv, csvClean, outputs, status => {
      let now = Date.now();
      this.spmSaving = false;
      this.spmSaved = now;

      setTimeout(() => {
        if (this.spmSaved == now) {
          this.spmSaved = 0;
        }
      }, 2000);
    }, (error, caught) => {
      this.spmSaving = false;
    });
  }

  private flattenProperty(dest, src) {
    if (!src) {
      return dest;
    }

    for (let entry of (<any> window).Object.entries(src)) {
      if (entry[1] && entry[0]) {
        switch (typeof(entry[1])) {
          case "string":
          case "number":
            dest[entry[0]] = entry[1];
            break;
          case "object":
            this.flattenProperty(dest, entry[1]);
            break;
          default:
            continue;
        }
      }
    }

    return dest;
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

  loadRevision(repair, remodel) {
    if (repair && repair.length > 0) {
      this.savedRepair = repair;
    }

    if (remodel && remodel.length > 0) {
      this.savedRemodel = remodel;
    }

    this.applyRevision();
  }

  applyRevision() {
    if (this.savedRepair) {
      let loaded = this.propertyService.getCurrentFlipRepairItems();
      let saved = [];

      for (let r of this.savedRepair) {
        saved[r.label] = r;
      }

      for (let r of loaded) {
        let s = saved[r.labelName];

        if (s) {
          r.included = s.active;
          r.sourceUnit = s.source;
          r.costBase0 = s.cost0;
          r.costBase1 = s.cost1;
        }
      }
    }

//    if (this.savedRemodel) {}

    this.propertyService.cleanAndRecalcFlipRepairs();
  }

  triggerSave() {
    this.propertyService.cleanAndRecalcFlipRepairs();

    let repairs = this.propertyService.getCurrentFlipRepairItems();
    let filteredRepairs = [];

    for (let e of repairs) {
      if (!e.included) {
        continue;
      }

      filteredRepairs.push({
        'label': e.labelName,
        'active': e.included,
        'source': e.sourceUnit,
        'cost0': e.costBase0,
        'cost1': e.costBase1,
        'total': e.cost
      });
    }

    this.notesService.postRR(this.bippoId, { 'repair': filteredRepairs }, () => {}, (error, caught) => {
      console.log(error + ' while saving Repair/Remodel');
    });
  }

  toggleRepairRemodelWindow() {
    this.rrVisible = !this.rrVisible;
  }

  switchRepairRemodel() {
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

  spmToolbar(ac, cond) {
    if (this.spmToolbarCallback) {
      if (cond !== undefined && cond != null && !cond) {
        return;
      }

      this.spmToolbarCallback(ac);
    }
  }

  selectQuality(q, spmSet = undefined) {
    if (spmSet && this.spmToolbarCallback) {
      this.spmToolbarCallback('setQualityClass', spmSet);
    }

    if ("undefined" === typeof q) {
      return;
    } else if (q === this.propertyService.getFlipSelectedQuality()) {
      this.showQualityDetails = true;
      return;
    } else if (this.propertyService.simpleQuality && (q < 1 || q > 3)) {
      return;
    } else if (q < 0 || q > 5) {
      return;
    }

    this.showQualityDetails = false;
    this.propertyService.selectQualityScore(q);
  }

  selectNextQuality() {
    let quality = this.propertyService.getFlipSelectedQuality();

    if ("undefined" === typeof quality) {
      return;
    } else if (this.propertyService.simpleQuality) {
      if (quality > 1 && quality <= 3) {
        this.propertyService.selectQualityScore(quality - 1);
      }
    } else if (quality > 0 && quality <= 5) {
      this.propertyService.selectQualityScore(quality - 1);
    }
  }

  selectPrevQuality() {
    let quality = this.propertyService.getFlipSelectedQuality();

    if ("undefined" === typeof quality) {
      return;
    }

    if (this.propertyService.simpleQuality) {
      if (quality >= 1 && quality < 3) {
        this.propertyService.selectQualityScore(quality + 1);
      }
    } else if (quality >= 0 && quality < 5) {
      this.propertyService.selectQualityScore(quality + 1);
    }
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
      let newProfit = this.forceRoi * (this.propertyService.propertyFlipData.maxBid + this.propertyService.propertyFlipData.costToFlip);

      if (newProfit < 0) {
        newProfit = 0;
      }

      this.propertyService.propertyFlip.profit = newProfit;
      this.propertyService.updatePropertyFlipTotals();
      this.propertyService.fixProfit();
      this.forceRoi = null;
    }
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
      return value * 100;
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

  getDisplayStatus(item) {
    if (!item.category) {
      return true;
    }

    if (Object.keys(this.categoryDisplay).length < 1) {
      this.categoryDisplay[item.category] = true;
      return true;
    }

    return !!this.categoryDisplay[item.category];
  }

  toggleCategoryDisplay(item) {
    let cat = this.getDisplayedCategory(item);

    if (cat) {
      this.categoryDisplay[cat] = this.categoryDisplay[cat] ? false : true;
    }
  }

  isCategoryBold(item) {
    if (!item.category) {
      return false;
    }

    switch (item.category) {
      case 'Interior':
      case 'Exterior':
      case 'Systems':
        return true;
      default:
        return false;
    }
  }

  getDisplayedCategory(item) {
    if (!item.category) {
      return null;
    }

    let all = this.propertyService.getCurrentFlipRepairItems();
    let i = all.indexOf(item);

    if (i < 0) {
      return item.category + '?';
    }

    if (i > 0 && all[i - 1].category == item.category) {
      return null;
    }

    return item.category;

/*    if (item.included) {
      return item.category;
    }

    for (let j = i + 1; j < all.length; j++) {
      if (all[j].category != item.category) {
        return null;
      } else if (all[j].included) {
        return item.category;
      }
    }*/
  }

  getSingularUnit(u) {
    if (u) {
      switch (u) {
        case 'squares':
          return 'square';
        default:
          return u;
      }
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

  togglePhotoEditing() {
    this.editPhotos = !this.editPhotos;
  }
}
