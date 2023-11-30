import { Component, OnInit, AfterViewInit, ElementRef, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { PropertyService } from './property.service';
import { SearchService } from '../search/search.service';
import { PrintViewService } from '../util/printview.service';
import { Observable } from 'rxjs/Rx';
import * as moment from 'moment/moment';


@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-trends',
  templateUrl: 'property-trends.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyTrendsComponent implements OnInit {
  private _property: any;
  private _fullWidth: boolean = false;
  private _perPage: number = 10;
  @Input()
  set property(property: any) {
    this._property = property;
  }
  @Input()
  set fullWidth(enabled: boolean) {
    this._fullWidth = enabled;
  }
  @Input()
  set perPage(ct: number) {
    this._perPage = ct;
  }

  propertyService: PropertyService;
  searchService: SearchService;
  printViewService: PrintViewService;
  trendsTab: number;
  ninjaSliderId: string;
  thumbSliderId: string;
  private element: ElementRef;
  statusIndexes: any;
  currentPages: any;
  touchPanes: any;
  expandedStatus: string;
  protected summaryProperty: string = null;
  public activeTab: string = 'Active';
  selectedSum: number = 0;
  selectedCount: number = 0;
  private summary: any = {};

  constructor(propertyService: PropertyService,
        searchService: SearchService,
        printViewService: PrintViewService,
        element: ElementRef) {
    this.propertyService = propertyService;
    this.searchService = searchService;
    this.printViewService = printViewService;
    this.element = element;
    this._property = {};
    this.expandedStatus = null;
  }

  ngOnInit() {
    this.trendsTab = 1;
    this.currentPages = {};
    this.statusIndexes = {};
    let sliderIndex = String(Math.floor(Math.random() * (99999 - 10000)) + 10000);
    this.ninjaSliderId = "ninja-slider" + sliderIndex;
    this.thumbSliderId = "thumb-slider" + sliderIndex;
    this.propertyService.getAreaPropertyListings(this.propertyService.getPropertyId(this._property),
      () => {
        // this.setupTouchPanes();
        this.indexCmaComps();
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
  }

  setupTouchPanes() {
//    setTimeout(() => {
        try {
          this.touchPanes = jQuery(this.element.nativeElement)["find"](".tabswrapper .panes")["touchPanes"]({
              "change": tab => {
                  this.trendsTab = tab + 1;
              }
          });
          this.touchPanes.init();
        } catch (e) {
          console.warn('Error initializing touch panes in property-trends component: ', e);
        }
//    }, 50);
  }

  // ngAfterViewInit() {
  //   setTimeout(() => {
  //     this.touchPanes = jQuery(this.element.nativeElement)["find"](".tabswrapper .panes")["touchPanes"]({
  //       "change": (tab) => {
  //         this.trendsTab = tab + 1;
  //       }
  //     });
  //     this.touchPanes.init();
  //   }, 5000);
  // }

  getProperty(valueset: string = undefined) {
    return this.propertyService.getPropertyData(this._property, valueset);
  }

  setTrendsTab(tab: number) {
    this.trendsTab = tab;
  }

  changeStatus(status: string) {
    this.activeTab = status;
    // this.touchPanes.changePane(this.groupStatusIndex(status) - 1);
  }

  groupStatusIndex(status: string) {
    let group: any;
    let index: number;
    if ("undefined" === typeof this.statusIndexes[status]) {
      index = 0;
      for (group of this.propertyService.areaPropertyGroups) {
        index++;
        this.statusIndexes[group.status] = index;
      }
    }

    return this.statusIndexes[status];
  }

  toggleStatus(status: string) {
    if (this.expandedStatus !== status) {
      this.expandedStatus = status;
    } else {
      this.expandedStatus = null;
    }
  }

  isExpanded(status: string) {
    return this.expandedStatus === status;
  }

  getCurrentPage(status: string) {
    return ("undefined" !== typeof this.currentPages[status]) ? this.currentPages[status] : 0;
  }

  setCurrentPage(status: string, p: number) {
    this.currentPages[status] = p;
  }

  roundDom(dom) {
    for (let i = 14; i < 365; i += 14) if (dom < i) return '< ' + i;
    return '> 365';
  }

  togglePropertySummary(property: any) {
    if (!this.summaryProperty || (this.summaryProperty !== this.propertyService.getPropertyId(property))) {
      this.summaryProperty = this.propertyService.getPropertyId(property);
    } else {
      this.summaryProperty = null;
    }
  }

  isPropertySummaryOpen(property: any) {
    return this.summaryProperty && (this.summaryProperty === this.propertyService.getPropertyId(property));
  }

  pricePerFootage(price, footage) {
    return Number(String(price).replace(/\D/g, "")) / Number(String(footage).replace(/\D/g, ""));
  }

  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
  }

  formatPool(lot){
    return Number(lot.poolInd) || Number(lot.poolType) ? 'Yes' : 'No';
  }

  togglePrintableMode() {
    this.printViewService.toggle();

    if (this.printViewService.printableMode) {
      setTimeout(() => window.print(), 500);
    }
  }

  deselectAll() {
    this.toggleAll(true);
  }

  selectAll() {
    this.toggleAll(false);
  }

  deselectByStatus(stat) {
    this.toggleByStatus(stat, true);
  }

  selectByStatus(stat) {
    this.toggleByStatus(stat, false)
  }

  toggleAll(toggleIf) {
    for (let group of this.propertyService.areaPropertyGroups) {
      for (let prop of group.group) {
        if (toggleIf === !!prop.cmaCompSelected) {
          this.toggleCmaCompSelected(prop);
        }
      }
    }
  }

  toggleByStatus(stat, toggleIf) {
    for (let group of this.propertyService.areaPropertyGroups) {
      if (group.status != stat) {
        continue;
      }

      for (let prop of group.group) {
        if (toggleIf === !!prop.cmaCompSelected) {
          this.toggleCmaCompSelected(prop);
        }
      }
    }
  }

  recalculateCmaAverage() {
    if (this.selectedCount < 1) {
      this.propertyService.property.market.cmaAverage = 0;
    } else {
      let averagePer = this.selectedSum / this.selectedCount;
      this.propertyService.property.market.cmaAverage = averagePer * this.propertyService.property.hitMergedResponse.building.size.bldgSize;
      console.log('CMA Average', this.propertyService.property.market.cmaAverage, averagePer, this.selectedSum, this.selectedCount);
    }
  }

  updateSummary(listPrices, soldPrices) {
    listPrices = listPrices || [];
    soldPrices = soldPrices || [];

    listPrices.sort((a, b) => a - b);
    soldPrices.sort((a, b) => a - b);

    let listMed = listPrices.length < 1 ? 0 : listPrices[Math.floor(listPrices.length / 2)];
    let soldMed = soldPrices.length < 1 ? 0 : soldPrices[Math.floor(soldPrices.length / 2)];

    this.summary = {
      listCount: listPrices.length,
      listMin: Math.min.apply(Math, listPrices),
      listMax: Math.max.apply(Math, listPrices),
      listMedian: listMed,
      listAverage: listPrices.reduce((a, b) => a + b) / listPrices.length,
      soldCount: soldPrices.length,
      soldMin: Math.min.apply(Math, soldPrices),
      soldMax: Math.max.apply(Math, soldPrices),
      soldMedian: soldMed,
      soldAverage: soldPrices.reduce((a, b) => a + b) / soldPrices.length
    };
  }

  indexCmaComps() {
    this.selectedCount = 0;
    this.selectedSum = 0;

    let listPrices = [];
    let soldPrices = [];

    for (let group of this.propertyService.areaPropertyGroups) {
      for (let prop of group.group) {
        listPrices.push(prop.mls.listPrice);

        if ((group.status == 'Sold') || (group.status == 'Closed')) {
          soldPrices.push(prop.mls.closePrice);
        }

        if (prop.cmaCompSelected) {
          let usePrice = this.propertyService.hasClosePrice(prop) ? this.propertyService.getClosePrice(prop) : this.propertyService.getListPrice(prop);

          this.selectedCount++;
          this.selectedSum += this.pricePerFootage(usePrice, this.propertyService.getPropertyData(prop).building.size.bldgSize);
        }
      }
    }

    this.updateSummary(listPrices, soldPrices);
    this.recalculateCmaAverage();
  }

  toggleCmaCompSelected(prop) {
    let usePrice = this.propertyService.hasClosePrice(prop) ? this.propertyService.getClosePrice(prop) : this.propertyService.getListPrice(prop);
    let perSqft = this.pricePerFootage(usePrice, this.propertyService.getPropertyData(prop).building.size.bldgSize);

    if (prop.cmaCompSelected = !prop.cmaCompSelected) {
      this.selectedCount++;
      this.selectedSum += perSqft;
    } else {
      this.selectedCount--;
      this.selectedSum -= perSqft;
    }

    this.recalculateCmaAverage();
  }
}
