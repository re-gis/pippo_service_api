import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute }  from '@angular/router';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { PrintViewService } from '../util/printview.service';
import { ShrinkType } from './property-slideout.component';
import { Observable, Subscription } from 'rxjs/Rx';
import * as moment from 'moment/moment';

declare let numeral:any;

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-compalator',
  templateUrl: 'property-compalator.component.html',
  styleUrls: ['property.component.css']
})
/*
 * TODO: This is messy and should be cleaned up in the future.
 * Potential improvements include an abstract adjustment system
 * that is structured more like how the backend handles ARV/TOM.
 */
export class PropertyCompalatorComponent implements OnInit {
  private _active: boolean;
  @Input()
  set active(active: boolean) {
    setTimeout(() => {
      this._active = active;
      this.viewTab();
    });
  }
  propertyService: PropertyService;
  notesService: NotesService;
  searchService: SearchService;
  printViewService: PrintViewService;
  brandingActive: boolean = true;
  private sub: any;
  private bippoId: string;
  private lastCachedId: string;
  busy: Array<Subscription>;
  propertySummary: string = null;
  mapShrink: ShrinkType;
  altPropertyToggle: any;
  narrShowMore: boolean = false;
  private subjectValues: any = {
    yearBuilt: -1,
    quality: -1,
    condition: -1,
    view: 'neu',
    bedrooms: 0,
    bathsFull: 0,
    bathsHalf: 0,
    footage: 0,
    lot: 0,
    garages: 0
  };
  private dirtyAdjustments: any = {
    yearBuilt: false,
    quality: false,
    condition: false,
    view: false,
    bedrooms: false,
    bathsFull: false,
    bathsHalf: false,
    footage: false,
    lot: false,
    garages: false
  };
  private columnProperties: any = null;
  private columnPage: any = null;
  private columnStart: number = 0;
  private columnCount: number = 0;
  private columnAdjustments: boolean = true;
  private customCompMode: boolean = false;
  private compSelectionDisplayed: boolean = true;
  private compScrollIndex: number = 0;
  private compDragging: boolean = false;
  private compalatorValue: number = 0;
  private nSolds: any = '?';
  private nDays: any = '?';
  private nRadius: number = 1;
  private nSuperior: number = 0;
  private nEqual: number = 0;
  private nInferior: number = 0;
  private showCompsBreakdown: boolean = false;
  private userEdited: boolean = false;
  private savingState: number = 0;

  constructor(private router: Router,
        private route: ActivatedRoute,
        propertyService: PropertyService,
        notesService: NotesService,
        searchService: SearchService,
        printViewService: PrintViewService) {
    this.propertyService = propertyService;
    this.notesService = notesService;
    this.searchService = searchService;
    this.printViewService = printViewService;
    this.busy = [];
    this.mapShrink = {
      dir: "left",
      size: 0
    };
    this.altPropertyToggle = {};
  }

  ngOnInit() {
    this.bippoId = null;
    this.lastCachedId = null;
    this.sub = this.route.params.subscribe(params => {
      this.bippoId = this.propertyService.parsePropertyId(params['addr']);

      if (this._active) {
        this.viewTab();
      }
    });
    this.columnProperties = [];
    this.columnPage = [];
    this.columnCount = 0;
    this.columnStart = 0;
  }

  recache(everything, loadDetails) {
    if (everything) {
      this.lastCachedId = this.bippoId;
      this.compalatorValue = 0;
      this.columnAdjustments = true;
      this.columnProperties = this.propertyService.propertyComps;
      this.columnCount = (this.columnProperties || []).length;

      let filter = (this.propertyService.propertyCompsMeta || {}).compsFilterUsed || {};

      this.nSolds = (this.propertyService.propertyCompsBackground ? this.propertyService.propertyCompsBackground.length : 0) || '?';
      this.nDays = filter.statusChangeInDays || '?';
      this.nRadius = filter.proximityInMiles || 1;
      this.nSuperior = 0;
      this.nEqual = 0;
      this.nInferior = 0;

      if (this.columnProperties) {
        let initialQuality = this.propertyService.getFlipSelectedQuality();

        for (let i = 0; i < this.columnCount; i++) {
          let p = this.columnProperties[i] = JSON.parse(JSON.stringify(this.columnProperties[i]));

          p.adjustment = p.adjustment || {};

          if (p.rating) {
            switch (p.rating.type) {
              case 's':
                this.nSuperior++;
                break;
              case 'e':
                this.nEqual++;
                break;
              case 'i':
                this.nInferior++;
                break;
            }
          }

          for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
            p.adjustment[k] = p.adjustment[k] || { adjustmentValue: 0 };
          }

          p.adjustment.baseAdjustment = p.adjustment.postAdjustment && p.adjustment.netAdjustment ? p.adjustment.postAdjustment - p.adjustment.netAdjustment : 0;

          try {
            p.about = {
              yearBuilt: p.mls.summary.yearBuilt,
              quality: initialQuality,
              condition: 0,
              view: 'neu',
              bedrooms: p.mls.building.rooms.beds,
              bathsFull: p.mls.building.rooms.bathsFull,
              bathsHalf: p.mls.building.rooms.bathsHalf,
              footage: p.mls.building.size.livingSize || p.mls.building.size.bldgSize,
              lot: p.mls.lot.lotSizeInSQFT,
              garages: p.mls.building.parking.prkgSpaces
            };
          } catch (error) {
            console.error('error during comp about: ', p, error);
          }
        }
      } else {
        this.columnProperties = [];
      }

      this.columnStart = 0;
      this.columnPage = this.propertyService.propertyCompsSelected;
      this.showCompsBreakdown = this.nSuperior + this.nEqual + this.nInferior > 0;

      if (this.columnPage) {
        this.columnPage = this.columnPage.slice(0, 3);

        for (let i = 0; i < this.columnPage.length; i++) {
          this.columnPage[i] = this.findProperty(this.propertyService.getPropertyId(this.columnPage[i]));
        }
      } else {
        this.columnPage = [];
      }

      {
        let i = 0;

        while (this.columnPage.length < 3) {
          if (this.getUsageType(this.columnProperties[i])) {
            this.columnPage.push(this.columnProperties[i]);
          }

          if (++i >= this.columnCount) {
            break;
          }
        }

        while (this.columnPage.length < 3) {
          let n = { adjustment: {} };

          for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
            n.adjustment[k] = { adjustmentValue: 0 };
          }

          this.columnPage.push(n);
        }
      }

      this.userEdited = false;
      this.recalculateCompalator();

      this.columnProperties.sort((l, r) => {
        let lt = l.rating && l.rating.type ? l.rating.type : '';
        let rt = r.rating && r.rating.type ? r.rating.type : '';

        switch (lt) {
          case 's':
            lt = 0;
            break;
          case 'e':
            lt = 1;
            break;
          case 'i':
            lt = 2;
            break;
          default:
            lt = 3;
            break;
        }

        switch (rt) {
          case 's':
            rt = 0;
            break;
          case 'e':
            rt = 1;
            break;
          case 'i':
            rt = 2;
            break;
          default:
            rt = 3;
            break;
        }

        return lt - rt;
      });
    }

    for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
      this.dirtyAdjustments[k] = false;
    }

    let cur = this.propertyService.property;

    try { // NO!!
      this.subjectValues.yearBuilt = cur.mls && cur.mls.summary && cur.mls.summary.yearBuilt ? cur.mls.summary.yearBuilt : cur.hitMergedResponse && cur.hitMergedResponse.summary ? cur.hitMergedResponse.summary.yearBuilt || -1 : -1;
      this.subjectValues.quality = this.propertyService.getFlipSelectedQuality();
      this.subjectValues.condition = this.propertyService.getFlipRepairsCondition();
      this.subjectValues.view = 'neu';
      this.subjectValues.bedrooms = cur.mls && cur.mls.building && cur.mls.building.rooms && cur.mls.building.rooms.beds ? cur.mls.building.rooms.beds :
                  cur.hitMergedResponse && cur.hitMergedResponse.building && cur.hitMergedResponse.building.rooms ? cur.hitMergedResponse.building.rooms.beds || 0 : 0;
      this.subjectValues.bathsFull = cur.mls && cur.mls.building && cur.mls.building.rooms && cur.mls.building.rooms.bathsFull ? cur.mls.building.rooms.bathsFull :
                   cur.hitMergedResponse && cur.hitMergedResponse.building && cur.hitMergedResponse.building.rooms ? cur.hitMergedResponse.building.rooms.bathsFull || 0 : 0;
      this.subjectValues.bathsHalf = cur.mls && cur.mls.building && cur.mls.building.rooms && cur.mls.building.rooms.bathsHalf ? cur.mls.building.rooms.bathsHalf :
                   cur.hitMergedResponse && cur.hitMergedResponse.building && cur.hitMergedResponse.building.rooms ? cur.hitMergedResponse.building.rooms.bathsHalf || 0 : 0;
      this.subjectValues.footage = cur.mls && cur.mls.building && cur.mls.building.size && (cur.mls.building.size.livingSize || cur.mls.building.size.bldgSize) ?
                 cur.mls.building.size.livingSize || cur.mls.building.size.bldgSize :
                   cur.hitMergedResponse && cur.hitMergedResponse.building && cur.hitMergedResponse.building.size ? cur.hitMergedResponse.building.size.livingSize || cur.hitMergedResponse.building.size.bldgSize : 0;
      this.subjectValues.lot = cur.mls && cur.mls.lot && cur.mls.lot.lotSizeInSQFT ? cur.mls.lot.lotSizeInSQFT :
             cur.hitMergedResponse && cur.hitMergedResponse.lot ? cur.hitMergedResponse.lot.lotSizeInSQFT || 0 : 0;
      this.subjectValues.garages = cur.mls && cur.mls.building && cur.mls.building.parking && cur.mls.building.parking.prkgSpaces ? cur.mls.building.parking.prkgSpaces :
                 cur.hitMergedResponse && cur.hitMergedResponse.building && cur.hitMergedResponse.building.parking ? cur.hitMergedResponse.building.parking.prkgSpaces || 0 : 0
    } catch (error) {
      console.error('error during subject values: ', cur, error);
    }

    console.log('recached compalator data: ', this.subjectValues, this.columnProperties.map(p => p.about));

    if (loadDetails && everything) {
      this.applySavedDetails(loadDetails);
    }
  }

  formatSavedDetails() {
    let save = {
      subjectBippoId: this.bippoId,
      lastValue: this.compalatorValue,
      subjectInfo: Object.assign({}, this.subjectValues),
      selected: []
    };

    switch (save.subjectInfo.view) {
      case 'adv':
        save.subjectInfo.view = -1;
        break;
      case 'ben':
        save.subjectInfo.view = 1;
        break;
      case 'neu':
      default:
        save.subjectInfo.view = 0;
        break;
    }

    for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
      save.subjectInfo[k] = Number(save.subjectInfo[k]) || 0;
    }

    for (let c of this.columnPage) {
      let s = {
        bippoId: this.propertyService.getPropertyId(c),
        info: Object.assign({}, c.about),
        adjustments: {}
      };

      switch (s.info.view) {
        case 'adv':
          s.info.view = -1;
          break;
        case 'ben':
          s.info.view = 1;
          break;
        case 'neu':
        default:
          s.info.view = 0;
          break;
      }

      for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
        s.info[k] = Number(s.info[k]) || 0;

        if (c.adjustment[k]) {
          s.adjustments[k] = Number(c.adjustment[k].adjustmentValue) || 0;
        }
      }

      save.selected.push(s);
    }

    return save;
  }

  applySavedDetails(d) {
    // Last known compalator value is d.lastValue; maybe use this somewhere to show if the value has changed

    if (d.subjectInfo) {
      for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
        if (typeof d.subjectInfo[k] !== "undefined") {
          this.subjectValues[k] = Number(d.subjectInfo[k]);
        }
      }

      switch (this.subjectValues.view) {
        case -1:
          this.subjectValues.view = 'adv';
          break;
        case 1:
          this.subjectValues.view = 'ben';
          break;
        case 0:
        default:
          this.subjectValues.view = 'neu';
          break;
      }
    }

    if (!d.selected) {
      return;
    }

    let tempIndex = [];
    let newSelection = [];

    for (let comp of this.columnProperties) {
      tempIndex[this.propertyService.getPropertyId(comp)] = comp;
    }

    for (let s of d.selected) {
      if (!tempIndex[s.bippoId]) {
        console.error('Comp ' + s.bippoId + ' was selected, but cannot be found in this compalator instance\'s current scope!', tempIndex);
        return;
      }
    }

    for (let s of d.selected) {
      let c = tempIndex[s.bippoId];
      newSelection.push(c);

      if (s.info) {
        for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
          if (typeof s.info[k] !== "undefined") {
            c.about[k] = Number(s.info[k]);
          }
        }

        switch (c.about.view) { // view info is the only non-numeric data (as it is stored clientside), so we must remap it
          case -1:
            c.about.view = 'adv';
            break;
          case 1:
            c.about.view = 'ben';
            break;
          case 0:
          default:
            c.about.view = 'neu';
            break;
        }
      }

      if (s.adjustments) {
        for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
          if (typeof s.adjustments[k] !== "undefined") {
            c.adjustment[k].adjustmentValue = Number(s.adjustments[k]);
          }
        }
      }
    }

    this.columnPage = newSelection;
  }

  saveCompalator() {
    if (this.savingState == 1) {
      // We've already sent a save request
      return;
    }

    this.savingState = 1;

    let details = this.formatSavedDetails();
    console.log('Saving compalator w/ ', details);

    this.notesService.postCompalatorDetails(details,
      () => {
        console.log('Successfully saved compalator for ' + this.bippoId);
        this.savingState = 2;

        if (!this.searchService.inWatchlist(this.bippoId)) {
          this.searchService.toggleWatchlistSearchListing(this.propertyService.getCurrentProperty().identifier.bippoId, (error:any, caught: Observable<any>) => {
            console.log(error);
            return caught;
          });
        }
      },
      (error, caught) => {
        console.error('Failed to save compalator for ' + this.bippoId, error);
        this.savingState = 3;
      }
    );
  }

  findProperty(bippoId) {
    for (let p of this.columnProperties) {
      if (this.propertyService.getPropertyId(p) == bippoId) {
        return p;
      }
    }

    return null;
  }

  scrollCompsLeft() {
    if (this.compScrollIndex > 0) {
      this.compScrollIndex--;
    }
  }

  scrollCompsRight() {
    if (this.compScrollIndex < this.columnProperties.length - 5) {
      this.compScrollIndex++;
    }
  }

  getPrimaryCompType(comp) {
    if (comp && comp.rating && comp.rating.type) {
      switch (comp.rating.type) {
        case 's':
          return 0;
        case 'e':
          return 1;
        case 'i':
          return 2;
      }
    }

    return -1;
  }

  getUsageType(comp) {
    let compData = this.propertyService.getPropertyData(comp);

    if (compData && compData.identifier && compData.identifier.bippoId) {
      let bippoId = compData.identifier.bippoId;

      for (let i = 0; i < 3; i++) {
        if (this.columnPage[i]) {
          let selectedData = this.propertyService.getPropertyData(this.columnPage[i]);

          if (selectedData && selectedData.identifier && selectedData.identifier.bippoId === bippoId) {
            return i;
          }
        }
      }
    }

    return -1;
  }

  useComp(comp, at) {
    let existing = this.getUsageType(comp);

    if (existing == at) {
      return;
    } else if (existing >= 0) {
      this.columnPage[existing] = this.columnPage[at];
    }

    this.columnPage[at] = comp;
    this.recalculateCompalator();
  }

  isActive() {
    return this._active;
  }

  viewTab() {
    if (this._active && this.bippoId) {
      if ((this.propertyService.propertyCompBippoId !== this.bippoId) || (this.propertyService.propertyCompsType !== 'arv')) {
        this.busy = [
          this.propertyService.getPropertyCompsData(this.bippoId, 'arv', () => {
            console.log('Got property comps data, recaching indexed data..');

            this.notesService.getCompalatorDetails(this.bippoId, loaded => {
              this.recache(true, loaded);
            }, (error: any, caught: Observable<any>) => {
              console.log('Error loading saved compalator', error);
              this.recache(true, null);
            })

            setTimeout(() => {
              this.brandingActive = false;
            }, 5000);
          }, (error:any, caught: Observable<any>) => {
            console.log(error);
            return caught;
          })
        ];
      } else {
        this.recache(!this.lastCachedId || (this.lastCachedId == this.bippoId), null);
      }
    }
  }

  getCompType() {
    let prop = this.propertyService.property;

    if (prop && prop.hitMergedResponse.address && prop.hitMergedResponse.address.zipType) {
      return prop.hitMergedResponse.address.zipType != 'Unknown' ? prop.hitMergedResponse.address.zipType : "";
    }

    return 'Rural';
  }

  getListPrice(property) {
    if (("undefined" !== typeof property.mls) &&
        (null !== property.mls)) {
      return "$" + numeral(property.mls.listPrice).format("0,0");
    } else {
      return "No List";
    }
  }

  toggleWatchlistSearchListing(id: string) {
    this.searchService.toggleWatchlistSearchListing(id, (error:any, caught: Observable<any>) => {
      console.log(error);
      return caught;
    });
  }

  togglePropertySummary(id: any) {
    if ("string" !== typeof id) {
      id = this.propertyService.getPropertyId(id);
    }
    if (!this.propertySummary || (this.propertySummary !== <string>id)) {
      this.propertySummary = <string>id;
    } else {
      this.propertySummary = null;
    }
  }

  isPropertySummaryOpen(property: any) {
    return this.propertySummary &&
        (this.propertySummary === this.propertyService.getPropertyId(property));
  }

  setMapShrink(shrink: ShrinkType) {
    this.mapShrink = shrink;
  }

  setCompsShrink(shrink: ShrinkType) {
  }

  toggleCompsMapAlt(shrink: ShrinkType) {
    if (this.altPropertyToggle.toggle) {
      this.altPropertyToggle.toggle();
    } else {
      console.log('altPropertyToggle wasn\'t initialized! ' + this.altPropertyToggle);
    }
  }

  roundDom(dom) {
    for (let i = 14; i < 365; i += 14) if (dom < i) return '< ' + i;
    return '> 365';
  }

  pricePerFootage(price, footage) {
    if (!price) {
      return 0;
    }

    return Number(String(price).replace(/\D/g, "")) / Number(String(footage).replace(/\D/g, ""));
  }

  columnPrevPage() {
    if (!this.columnProperties || this.columnStart < 1) {
      return;
    }

    this.columnStart--;
    this.columnPage = this.columnProperties.slice(this.columnStart, this.columnStart + 3);
  }

  columnNextPage() {
    if (!this.columnProperties || this.columnStart + 1 > this.columnCount - 3) {
      return;
    }

    this.columnStart++;
    this.columnPage = this.columnProperties.slice(this.columnStart, this.columnStart + 3);
  }

  inferTotalRooms(d) {
    return d.roomsTotal ? d.roomsTotal : (d.beds + 4);
  }

  formatCompRating(comp) {
    if (comp && comp.rating && comp.rating.best) {
      return (Number(comp.rating.best.overall) / 10) + ' / 10';
    }

    return '?';
  }

  formatCompRatingLabel(comp) {
    if (comp && comp.rating && comp.rating.best) {
      switch (comp.rating.type) {
        case 's':
          return 'Larger';
        case 'e':
          return 'Similar Size';
        case 'i':
          return 'Smaller';
      }
    }

    return '';
  }

  formatCompRatingStars(rating) {
    if (rating) {
      return 'Proximity ' +      this.formatCompRatingStarEntry(rating.proximity)
              + '<br>Recency ' + this.formatCompRatingStarEntry(rating.recency)
              + '<br>GLA ' +     this.formatCompRatingStarEntry(rating.gla)
              + '<br>Year ' +    this.formatCompRatingStarEntry(rating.year);
    }

    return '';
  }

  formatCompRatingStarEntry(rating) {
    if (!rating) {
      return '';
    }

    let stars = Math.floor(rating / 25) + 1;
    let str = '';

    for (let i = 0; i < stars; i++) {
      str += '&#x2605;';
    }

    for (let i = 5; i > stars; i--) {
      str += '&#x2606;';
    }

    return str;
  }

  onDragStart(event, comp) {
    event.dataTransfer.setData('compIndex', comp);
    this.compDragging = true;
  }

  onDragEnd(event) {
    this.compDragging = false;
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onDrop(event, i) {
    let compIndex = event.dataTransfer.getData('compIndex');
    event.preventDefault();

    if (i >= 0 && i < 3) {
      let comp = this.columnProperties[compIndex];

      if (comp) {
        this.useComp(comp, i);
      }
    }
  }

  netAdjustment(comp) {
    let net = 0;

    for (let k of ['yearBuilt', 'quality', 'condition', 'view', 'bedrooms', 'bathsFull', 'bathsHalf', 'footage', 'lot', 'garages']) {
      let n = Number(comp.adjustment[k].adjustmentValue);

      if (n) {
        net += n;
      }
    }

    return net;
  }

  calculateAdjustment(adjustPer, subjectHas, compHas) {
    let delta = (subjectHas || 0) - (compHas || 0);
    return adjustPer * delta;
  }

  recalculateAdjustmentValue(v, p) {
    switch (v) {
      case 'quality': { // default 0
        p.adjustment.quality.adjustmentValue = 0;
        break;
      }
      case 'condition': { // default 0
        p.adjustment.condition.adjustmentValue = 0;
        break;
      }
      case 'view': {// default +/-3% of value (tax value for subject)
        let subject = Math.round(this.propertyService.getCurrentProperty().assessment.assessed.assdTtlValue * 0.03);
        let comp = Math.round(p.adjustment.baseAdjustment * 0.03);

        switch (this.subjectValues.view) {
          case 'neu':
            subject = 0;
            break;
          case 'adv':
            subject = -subject;
            break;
        }

        switch (p.about.view) {
          case 'neu':
            comp = 0;
            break;
          case 'adv':
            comp = -comp;
            break;
        }

        p.adjustment.view.adjustmentValue = subject - comp;
        break;
      }
      case 'bedrooms': { // default 2000 per
        p.adjustment.bedrooms.adjustmentValue = this.calculateAdjustment(2000, Number(this.subjectValues.bedrooms), Number(p.about.bedrooms));
        break;
      }
      case 'bathsFull': { // default 3000 per
        p.adjustment.bathsFull.adjustmentValue = this.calculateAdjustment(3000, Number(this.subjectValues.bathsFull), Number(p.about.bathsFull));
        break;
      }
      case 'bathsHalf': { // default 1500 per
        p.adjustment.bathsHalf.adjustmentValue = this.calculateAdjustment(1500, Number(this.subjectValues.bathsHalf), Number(p.about.bathsHalf));
        break;
      }
      case 'lot': { // default 0
        p.adjustment.lot.adjustmentValue = 0;
        break;
      }
      case 'garages': {
        p.adjustment.garages.adjustmentValue = this.calculateAdjustment(10000, Number(this.subjectValues.garages), Number(p.about.garages));
        break;
      }
      case 'yearBuilt':
      case 'footage':
        // Invalid: these values cannot be changed
        break;
      default:
        return;
    }
  }

  recalculateAdjustment(v, i) {
    if (i == -1) {
      for (let j = 0; j < 3; j++) {
        this.recalculateAdjustmentValue(v, this.columnPage[j]);
      }
    } else {
      this.recalculateAdjustmentValue(v, this.columnPage[i]);
    }

    this.dirtyAdjustments[v] = true;
    this.recalculatePost(i);

    setTimeout(() => {
      this.dirtyAdjustments[v] = false;
    }, 500);
  }

  recalculatePost(i) {
    if (i == -1) {
      for (let j = 0; j < 3; j++) {
        let c = this.columnPage[j];
        let net = c.adjustment.netAdjustment = this.netAdjustment(c);
        c.adjustment.postAdjustment = c.adjustment.baseAdjustment + net;
      }
    } else {
      let c = this.columnPage[i];
      let net = c.adjustment.netAdjustment = this.netAdjustment(c);
      c.adjustment.postAdjustment = c.adjustment.baseAdjustment + net;
    }

    this.recalculateCompalator();
  }

  recalculateCompalator() {
    let total = 0;
    let ct = 0;

    for (let p of this.columnPage) {
      let n = Number(p.adjustment.postAdjustment);

      if (n) {
        total += n;
        ct += 1.0;
      }
    }

    this.compalatorValue = total / ct;
    this.propertyService.propertyCompalatorValue = this.userEdited ? this.compalatorValue : 0;

    if (!this.userEdited) {
      this.userEdited = true;
    } else if (this.savingState != 0 && this.savingState != 1) {
      // Make the save button show "save" once again, if it is currently representing the success/failure of a prior save
      this.savingState = 0;
    }
  }

  changedSubjectValue(v) {
    if (v && (typeof this.subjectValues[v] !== "undefined")) {
      this.recalculateAdjustment(v, -1);
    } else {
      console.log('unknown subject change ' + v);
    }
  }

  changedCompValue(v, i) {
    if (v && this.columnPage[i] && (typeof this.columnPage[i].about[v] !== "undefined")) {
      this.recalculateAdjustment(v, i);
    } else {
      console.log('unknown about change: ' + i + '/' + v);
    }
  }

  changedCompAdjustment(v, i) {
    if (v && this.columnPage[i] && (typeof this.columnPage[i].adjustment[v] !== "undefined")) {
      this.recalculatePost(i);
    } else {
      console.log('unknown adjustment change' + i + '/' + v);
    }
  }

  selectQuality(val, i) {
    switch (i) {
      case -1:
        this.subjectValues.quality = val;
        this.changedSubjectValue('quality');
        return;
      case 0:
      case 1:
      case 2:
        this.columnPage[i].about.quality = val;
        break;
      default:
        return;
    }

    this.changedCompValue('quality', i);
  }

  selectCondition(val, i) {
    switch (i) {
      case -1:
        this.subjectValues.condition = val;
        this.changedSubjectValue('condition');
        return;
      case 0:
      case 1:
      case 2:
        this.columnPage[i].about.condition = val;
        break;
      default:
        return;
    }

    this.changedCompValue('condition', i);
  }

  selectView(val, i) {
    switch (i) {
      case -1:
        this.subjectValues.view = val;
        this.changedSubjectValue('view');
        return;
      case 0:
      case 1:
      case 2:
        this.columnPage[i].about.view = val;
        break;
      default:
        return;
    }

    this.changedCompValue('view', i);
  }

  getSaveDescription() {
    switch (this.savingState) {
      case 0:
        return this.searchService.inWatchlist(this.bippoId) ? 'Save' : 'Save & Watch';
      case 1:
        return 'Saving..';
      case 2:
        return 'Saved';
      case 3:
        return 'Error';
    }

    return 'Save';
  }

  togglePrintableMode() {
    this.printViewService.toggle();

    if (this.printViewService.printableMode) {
      setTimeout(() => window.print(), 500);
    }
  }
}
