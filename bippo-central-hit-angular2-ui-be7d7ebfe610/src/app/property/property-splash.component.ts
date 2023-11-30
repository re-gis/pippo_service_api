import { Component, OnInit, OnDestroy, Inject, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute }  from '@angular/router';
import { Location } from '@angular/common';
import {Observable} from 'rxjs/Rx';
import { DOCUMENT } from '@angular/platform-browser';
import { PageScrollInstance, PageScrollService } from '../ng2-page-scroll/ng2-page-scroll';
import * as moment from 'moment/moment';
import { BoundingRectClass, IEventSlideAble } from 'ng2-slideable-directive/slideable.directive';
import { PropertyService } from './property.service';
import { SearchService } from '../search/search.service';
import { AuthService } from '../auth/auth.service';
import { NotesService } from './notes.service';
import { GoogleStreetviewComponent } from '../map/google-streetview.component';
import { NgbModal, ModalDismissReasons, NgbTabsetService } from '../ui/index';
import { EditorModule, SharedModule } from '../primeng/primeng';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-splash',
  templateUrl: 'property-splash.component.html',
  styleUrls: ['property.component.css']
})
export class PropertySplashComponent implements OnInit, OnDestroy, AfterViewInit {
  propertyService: PropertyService;
  notesService: NotesService;
  searchService: SearchService;
  private sub: any;
  private document: Document;
  pageScrollInstance: PageScrollInstance;
  pageScrollService: PageScrollService;
  showGallerySlider: boolean = false;
  activeModal: any = null;
  primaryBackingData: string = null;
  mapActive: boolean = false;
  streetFailed: boolean = false;
  lastBippoId: string = "";
  scrubCalc: any = {
    marketPct: 1,
    marketPctFormatted: "+0%",
    initialMarket: 0,
    calcPct: 70,
    guessMarket: 0,
    cosmeticsSqft: 15,
    roofCust: 0,
    hvacCust: 0,
    foundationCust: 0,
    otherCust: 0,
    guessBid: 0
  };
  scrubCalcDirty: boolean = true;
  saving: boolean = false;

  constructor(private route: ActivatedRoute,
        private router: Router,
        propertyService: PropertyService,
        private location: Location,
        searchService: SearchService,
        notesService: NotesService,
        private modalService: NgbModal,
        private tabsetService: NgbTabsetService,
        pageScrollService: PageScrollService,
        @Inject(DOCUMENT) document: any) {
    this.propertyService = propertyService;
    this.notesService = notesService;
    this.searchService = searchService;
    this.document = <Document> document;
    this.pageScrollService = pageScrollService;
  }

  doChange() {
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      let bippoId = this.propertyService.parsePropertyId(params['addr']);
      this.lastBippoId = bippoId;
      this.propertyService.getProperty(bippoId, () => {
        let prop = this.propertyService.getCurrentProperty();

        if (!prop) {
          this.primaryBackingData = null;
        } else if (prop.auction && prop.auction.auctionDate) {
          this.primaryBackingData = 'auc';
        } else if (prop.mls && prop.mls.status) {
          this.primaryBackingData = 'mls';
        } else {
          this.primaryBackingData = 'tax';
        }

        let flag = this.propertyService.getPropertyFlag('revision_quickequity');
        this.saving = false;

        if (flag) {
          console.log('loading ' + (flag.revisionQuickEquity.isDefault ? 'default settings' : 'previous revision'), flag.revisionQuickEquity);

          this.scrubCalc = Object.assign({
            marketPct: 1,
            marketPctFormatted: "+0%",
            initialMarket: 0,
            calcPct: 70,
            guessMarket: 0,
            cosmeticsSqft: 15,
            roofCust: 0,
            hvacCust: 0,
            foundationCust: 0,
            otherCust: 0,
            guessBid: 0
          }, flag.revisionQuickEquity);

          let pct = Math.floor((this.scrubCalc.marketPct - 1.0) * 1000) / 10.0;
          this.scrubCalcDirty = false;

          if (pct < 0) {
            this.scrubCalc.marketPctFormatted = String(pct) + '%';
          } else {
            this.scrubCalc.marketPctFormatted = "+" + String(pct) + '%';
          }
        } else {
          this.scrubCalc = {
            marketPct: 1,
            marketPctFormatted: "+0%",
            initialMarket: 0,
            calcPct: 70,
            guessMarket: 0,
            cosmeticsSqft: 15,
            roofCust: 0,
            hvacCust: 0,
            foundationCust: 0,
            otherCust: 0,
            guessBid: 0
          };
        }
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      }, 'quick');

      this.propertyService.getPropertyCompsData(bippoId, "arv",
        () => {
          this.finishMarketPct(null);
        },
        (error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
      });
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initPageScroll();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  changeMarketPct(event: IEventSlideAble) {
    // Translate [0, 100] into [-15.0, 15.0] in increments of .5
    let pct = Math.round((event.relativePercentHorisontal - 50) * 0.6) / 2.0;
    console.log('setting ARV pct to', pct);

    this.scrubCalc.marketPct = 1.0 + pct / 100.0;

    if (pct < 0) {
      this.scrubCalc.marketPctFormatted = String(pct) + '%';
    } else {
      this.scrubCalc.marketPctFormatted = "+" + String(pct) + '%';
    }

    this.scrubCalc.initialMarket = 0;

    if (this.propertyService.property && this.propertyService.property.market && this.propertyService.property.market.arv) {
      this.scrubCalc.initialMarket = this.scrubCalc.marketPct * this.propertyService.property.market.arv;
    }

    this.recalcGuess(true);
  }

  finishMarketPct(event: IEventSlideAble) {
    this.scrubCalc.initialMarket = 0;

    if (this.propertyService.property && this.propertyService.property.market && this.propertyService.property.market.arv) {
      this.scrubCalc.initialMarket = this.scrubCalc.marketPct * this.propertyService.property.market.arv;
    }

    this.recalcGuess(!!event);
  }

  presetCosmetics(e) {
    this.scrubCalc.cosmeticsSqft = e;

    let sqft = +this.propertyService.getCurrentProperty().building.size.livingSize;
    this.scrubCalc.cosmeticsCust = sqft * +this.scrubCalc.cosmeticsSqft;

    this.recalcGuess(true);
  }

  manualCosmetics(e) {
    this.scrubCalc.cosmeticsCust = e;
    this.scrubCalc.cosmeticsSqft = 0;

    this.recalcGuess(true);
  }

  recalcGuess(dirty: boolean = false) {
    if (dirty) {
      this.scrubCalcDirty = true;
    }

    this.scrubCalc.guessMarket = +this.scrubCalc.calcPct / 100.0 * +this.scrubCalc.initialMarket;

    if (+this.scrubCalc.guessMarket) {
      if (+this.scrubCalc.cosmeticsSqft && !+this.scrubCalc.cosmeticsCust) {
        let sqft = +this.propertyService.getCurrentProperty().building.size.livingSize;
        this.scrubCalc.cosmeticsCust = sqft * +this.scrubCalc.cosmeticsSqft;
      }

      let costs = +this.scrubCalc.cosmeticsCust + +this.scrubCalc.roofCust + +this.scrubCalc.hvacCust + +this.scrubCalc.foundationCust + +this.scrubCalc.otherCust;
      this.scrubCalc.guessBid = +this.scrubCalc.guessMarket - costs;
    } else {
      this.scrubCalc.guessBid = 0;
    }
  }

  saveQuickEquity() {
    if (this.saving || !this.lastBippoId) {
      return;
    }

    this.saving = true;
    this.scrubCalc.finalValue = this.scrubCalc.guessBid;
    this.notesService.postQuickEquity(this.lastBippoId, this.scrubCalc,
      () => {
        this.saving = false;
        this.scrubCalcDirty = false;
      },
      (error, caught) => {
        console.error('Failed to save QuickEquity for ' + this.lastBippoId, error);
        this.saving = false;
      });
  }

  backToSearch() {
    this.location.back();
  }

  initPageScroll() {
    this.pageScrollInstance = PageScrollInstance.advancedInstance(
        this.document,
        "#ninjaSliderModal",
        null,
        null, //this.pageScroll,
        40, //this.pageScrollOffset,
        null, //this.pageScrollInterruptible,
        null, //this.pageScrollEasing,
        null, //this.pageScrollDuration,
        null  //this.pageScrollFinish
    );
  }

  toggleWatchlistSearchListing() {
    this.searchService.toggleWatchlistSearchListing(this.propertyService.getCurrentProperty().identifier.bippoId, (error:any, caught: Observable<any>) => {
      console.log(error);
      return caught;
    });
  }

/*  showNotesModal(event, content) {
      event.preventDefault();

      if (this.activeModal) {
          this.activeModal.close();
          this.activeModal = null;
      } else {
          this.activeModal = this.modalService.open(content);
          this.activeModal.result.then((result) => {
            // Do nothing
          }, (reason) => {
            // Do nothing
          });
      }
  }

  savePropertyNote() {
    this.notesService.savePropertyNote(this.propertyService.getPropertyId(), (error:any, caught: Observable<any>) => {
      console.log(error);
      return caught;
    });
  }*/

  onStreetviewFailed(status) {
    this.mapActive = true;
    this.streetFailed = true;
  }

  toggleMapStreet() {
    this.mapActive = !this.mapActive;
  }

  navigateToProperty() {
    this.router.navigate(['/property', this.lastBippoId]);
  }

  formatDate(dt, fmt) {
    return moment(dt).format(fmt);
  }

  roundDom(dom) {
    for (let i = 14; i < 365; i += 14) if (dom < i) return '< ' + i;
    return '> 365';
  }
}
