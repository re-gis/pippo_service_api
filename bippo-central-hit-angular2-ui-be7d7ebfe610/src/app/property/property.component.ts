import { Component, OnInit, OnDestroy, Inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute }  from '@angular/router';
import { Location } from '@angular/common';
import {Observable} from 'rxjs/Rx';
import { DOCUMENT } from '@angular/platform-browser';
import { PageScrollInstance, PageScrollService } from '../ng2-page-scroll/ng2-page-scroll';
import * as moment from 'moment/moment';
import { PropertyService } from './property.service';
import { SearchService } from '../search/search.service';
import { AuthService } from '../auth/auth.service';
import { NotesService } from './notes.service';
import { PrintViewService } from '../util/printview.service';
import { VideoTutorialService } from '../util/video-tutorial.service';
import { GoogleStreetviewComponent } from '../map/google-streetview.component';
import { NgbModal, ModalDismissReasons, NgbTabsetService } from '../ui/index';
import { EditorModule, SharedModule } from '../primeng/primeng';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property',
  templateUrl: 'property.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyComponent implements OnInit, OnDestroy, AfterViewInit {
  propertyService: PropertyService;
  searchService: SearchService;
  authService: AuthService;
  notesService: NotesService;
  printViewService: PrintViewService;
  tutorialService: VideoTutorialService;
  lastBippoId: string;
  activeTab: string;
  tabForVideo: string;
  imageTab: string;
  galleryTab: string;
  private sub: any;
  private document: Document;
  pageScrollInstance: PageScrollInstance;
  pageScrollService: PageScrollService;
  showGallerySlider: boolean = false;
  thumbnailGallery: boolean = false;
  activeModal: any = null;
  primaryBackingData: string = null;
  pendingLoad: boolean = false;
  watchlisted: boolean = false;
  watchlistedNow: any = null;

  constructor(private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private cdRef: ChangeDetectorRef,
        propertyService: PropertyService,
        searchService: SearchService,
        authService: AuthService,
        notesService: NotesService,
        printViewService: PrintViewService,
        tutorialService: VideoTutorialService,
        private modalService: NgbModal,
        private tabsetService: NgbTabsetService,
        pageScrollService: PageScrollService,
        @Inject(DOCUMENT) document: any) {
    this.authService = authService;
    this.propertyService = propertyService;
    this.searchService = searchService;
    this.notesService = notesService;
    this.printViewService = printViewService;
    this.tutorialService = tutorialService;
    this.document = <Document> document;
    this.pageScrollService = pageScrollService;
  }

  doChange() {
    if (this.tabForVideo != this.activeTab) {
      let url = null;
      let title = null;

      switch (this.tabForVideo = this.activeTab) {
        case 'tab-general':
          url = 'https://www.youtube-nocookie.com/embed/8w_iHAKMqvk?rel=0&amp;showinfo=0';
          title = 'Property Page: The General Tab';
          break;
        case 'tab-flip':
          url = 'https://www.youtube-nocookie.com/embed/j41OerDm24w?rel=0&amp;showinfo=0';
          title = 'Property Page: The Buy & Sell Calculator';
          break;
        case 'tab-compalator':
          url = 'https://www.youtube-nocookie.com/embed/HxPHwAX3QJU?rel=0&amp;showinfo=0';
          title = 'Property Page: The Compalator, a Calculator for Comps';
          break;
        case 'tab-arv':
          url = 'https://www.youtube-nocookie.com/embed/BnX9OXaHsBA?rel=0&amp;showinfo=0';
          title = 'Property Page: The After Repaired Value Tab';
          break;
        case 'tab-asis':
          url = 'https://www.youtube-nocookie.com/embed/QhtDr9h5Bwg?rel=0&amp;showinfo=0';
          title = 'Property Page: The Market Average Tab';
          break;
        case 'tab-wholesale':
          url = 'https://www.youtube-nocookie.com/embed/RtDNOcgeXBQ?rel=0&amp;showinfo=0'
          title = 'Property Page: The Wholesale Tab'
          break;
        case 'tab-rental':
          url = 'https://www.youtube-nocookie.com/embed/iehwEXGv5tQ?rel=0&amp;showinfo=0';
          title = 'Property Page: The Rents Tab';
          break;
        case 'tab-repairs':
          url = 'https://www.youtube-nocookie.com/embed/bYSOcHTomzM?rel=0&amp;showinfo=0';
          title = 'Property Page: The Repair Calculator';
          break;
        default:
          url = null;
          break;
      }

      if (url) {
        this.tutorialService.setVideo(url, title);
      } else {
        this.tutorialService.setVideo(null);
      }
    }
  }

  ngOnInit() {
    this.pendingLoad = true;
    this.sub = this.route.params.subscribe(params => {
      let bippoId = this.propertyService.parsePropertyId(params['addr']);
      this.lastBippoId = bippoId;
      this.watchlistedNow = false;
      this.watchlisted = null;
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

        if (prop && prop.mls && prop.mls.mlsRegion) {
          this.searchService.setMLS(prop.mls.mlsRegion);
        }

        for (let pf of this.propertyService.getPropertyFlags()) {
          if (pf.flag == 'oldmls') {
            // Flag indicating that this property includes old MLS data for some given reason
            // Treat this like its primaryBackingData source were tax for purposes of the header
            if (this.primaryBackingData == 'mls') {
              this.primaryBackingData = 'tax';
            }
          }
        }

        this.pendingLoad = false;
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.propertyService.getPropertyFlipData(bippoId, () => {
          this.propertyService.generatePropertyFlipDeps();
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
      this.propertyService.getPropertyRentData(bippoId, () => {
          this.propertyService.generatePropertyRentDeps();
      },(error, caught) => {
          console.log(error);
          return caught;
      });
      this.propertyService.getPropertyCompsData(bippoId, "all", //"arv",
        () => {},
        (error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
      });
      this.propertyService.getAreaPropertyListings(bippoId,
        () => {},
        (error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
      });
      this.notesService.getPropertyNotes(bippoId, (error, caught) => {
          console.log(error);
          return caught;
      });
      this.activeTab = 'tab-general';
      this.galleryTab = "tab-gallery";
      this.imageTab = 'tab-image';
      this.doChange();
    });
  }

  ngAfterViewChecked(){
    this.cdRef.detectChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initPageScroll();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  backToSplash() {
    this.router.navigate(['/property/preview', this.lastBippoId]);
  }

  backToSearch() {
    if (this.searchService.backToSearchUrl) {
      this.searchService.backToSearch = true;
      this.router.navigate([this.searchService.backToSearchUrl]);
    }
  }

  viewPrevious() {
    this.pendingLoad = true;
    this.searchService.viewPreviousProperty(this.router);
  }

  viewNext() {
    this.pendingLoad = true;
    this.searchService.viewNextProperty(this.router);
  }

  checkWatchlisted() {
//    if (this.propertyService.getCurrentProperty() && this.propertyService.getCurrentProperty().identifier && this.propertyService.getCurrentProperty().identifier.bippoId) {
//      let watched = this.searchService.inWatchlist(this.propertyService.getCurrentProperty().identifier.bippoId);
    if (this.lastBippoId) {
      let watched = this.searchService.inWatchlist(this.lastBippoId);

      if (this.watchlisted === null) {
        this.watchlisted = watched;
      } else if (watched && !this.watchlisted) {
        this.watchlistedNow = true;
      } else if (!watched && this.watchlisted) {
        this.watchlistedNow = false;
      }

      return this.watchlisted = watched;
    } else {
      return false;
    }
  }

  getGarageSpaces(covered) {
    let s = this.propertyService.getGarageSpaces(null, null);

    if (s && s >= 1) {
      return s;
    }

    return covered;
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

  launchGallery(index = 0) {
    if (!this.showGallerySlider) {
      this.showGallerySlider = true;
      this.printViewService.printableMode = true;

      setTimeout(() => {
        this.pageScrollService.start(this.pageScrollInstance);
        if ("tab-gallery" === this.galleryTab) {
          this.propertyService.initSliders("ninjaSliderModal", "thumbSliderModal", 0);
        }
      }, 50);
    }
  }

  toggleThumbnails() {
    this.thumbnailGallery = !this.thumbnailGallery;
  }

  closeGallery() {
    this.showGallerySlider = false;
    this.printViewService.printableMode = false;
  }

  selectImage(tabname: string) {
    this.imageTab = tabname;
  }

  selectGallery(tabname: string) {
    this.galleryTab = tabname;
  }

  toggleWatchlistSearchListing() {
    this.searchService.toggleWatchlistSearchListing(this.propertyService.getCurrentProperty().identifier.bippoId, (error:any, caught: Observable<any>) => {
      console.log(error);
      return caught;
    });
  }

  showNotesModal(event, content) {
      event.preventDefault();

      if (this.activeModal) {
          this.activeModal.close();
          this.activeModal = null;
      }

console.log('Opening notes ', content);
      this.activeModal = this.modalService.open(content);
      this.activeModal.result.then((result) => {
        // Do nothing
      }, (reason) => {
        // Do nothing
      });
  }

  savePropertyNote() {
    this.notesService.savePropertyNote(this.propertyService.getPropertyId(), (error:any, caught: Observable<any>) => {
      console.log(error);
      return caught;
    });
  }

  tabFullWidth(t) {
    switch (t) {
      case 'tab-cma':
        return true;
      default:
        return false;
    }
  }

  tabHasHeader(t) {
    switch (t) {
      case 'tab-general':
      case 'tab-flip':
      case 'tab-rent':
      case 'tab-onepct':
        return true;
      default:
        return false;
    }
  }

  tabHasFooter(t) {
    return t == 'tab-general' || !this.tabHasHeader(t);
  }

  setActiveTab(tab: string) {
    console.log("Setting active tab", tab);
    this.tabsetService.select("property-tabs", tab);
    //this.activeTab = tab;
  }

  setGalleryTab(tabname: string) {
    this.galleryTab = tabname;
    if ("tab-gallery" === tabname) {
      this.propertyService.initSliders("ninjaSliderModal", "thumbSliderModal", 0);
    }
  }

  isMapActive(view: string) {
    let property: any = this.propertyService.getCurrentProperty();

    return (this.galleryTab == view) &&
        ("undefined" !== typeof property.location) &&
        property.location.latitude &&
        property.location.longitude;
  }

  formatDate(dt, fmt) {
    return moment(dt).format(fmt);
  }

  roundDom(dom) {
    for (let i = 14; i < 365; i += 14) if (dom < i) return '< ' + i;
    return '> 365';
  }

  makeOffer() {
    this.router.navigate(['/contract', this.propertyService.getCurrentProperty().identifier.bippoId]);
  }
}
