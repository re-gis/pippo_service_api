import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute }  from '@angular/router';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { ShrinkType } from './property-slideout.component';
import { Observable, Subscription } from 'rxjs/Rx';
import * as moment from 'moment/moment';

declare let numeral:any;

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-comps',
  templateUrl: 'property-comps.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyCompsComponent implements OnInit {
  private _active: boolean;
  @Input()
  set active(active: boolean) {
    setTimeout(() => {
      this._active = active;
      this.viewTab();
    });
  }
  @Input() type: string;
  @Output() navigateTo: EventEmitter<string> = new EventEmitter<string>();
  propertyService: PropertyService;
  notesService: NotesService;
  searchService: SearchService;
  brandingActive: boolean = true;
  private sub: any;
  private bippoId: string;
  busy: Array<Subscription>;
  propertySummary: string = null;
  mapShrink: ShrinkType;
  altPropertyToggle: any;
  narrShowMore: boolean = false;
  resultsShowMore: boolean = false;
  private page: number = 0;
  private pageNames: Array<string> = [
    "Overview", "Adjustments", "Excluded"
  ];
  private columnProperties: any = null;
  private columnPage: any = null;
  private columnStart: number = 0;
  private columnCount: number = 0;
  private columnAdjustments: boolean = true;
  private adjustmentCategories: Array<string> = [];
  private adjustmentCatNames: any = {};
  private createBracket: boolean = false;
  private compsUniverse: any = null;
  private compsFilter: any = null;
  private filterProximity: any = [];
  private filterGla: any = [];
  private filterSale: any = [];
  private generatedValue: boolean = false;
  private customFiltersPresent: boolean = false;
  private saving: boolean = false;
  private lastResults: number = 0;
  private loadDescription: any = "";
  private initialFilter = {
    proximity: null,
    gla: null,
    sale: null
  };

  constructor(private router: Router,
        private route: ActivatedRoute,
        propertyService: PropertyService,
        notesService: NotesService,
        searchService: SearchService) {
    this.propertyService = propertyService;
    this.notesService = notesService;
    this.searchService = searchService;
    this.busy = [];
    this.mapShrink = {
      dir: "left",
      size: 0
    };
    this.altPropertyToggle = {};
  }

  hasExcludedComps() {
    return this.propertyService.propertyCompsExcluded && this.propertyService.propertyCompsExcluded.length > 0;
  }

  getExcludedReason(p) {
    if (p.reason) {
      if (p.reason.startsWith("stories/")) {
        return "Stories don't match subject";
      } else if (p.reason.startsWith("median/")) {
        return "Class exceeds subject";
      }
    }

    return "";
  }

  getLastPage() {
//    if (this.hasExcludedComps()) {
//      return 2;
//    }

    return 1;
  }

  ngOnInit() {
    this.bippoId = null;
    this.sub = this.route.params.subscribe(params => {
      this.bippoId = this.propertyService.parsePropertyId(params['addr']);
    });
    this.page = 0;

    this.recacheColumnProperties(true);
  }

  resetArvRevision() {
    this.unfilterComps();
    this.recacheColumnProperties(true, true);
  }

  saveArvRevision() {
    let reportedComps = null;

    switch (this.type) {
      case "arv":
        reportedComps = this.propertyService.propertyCompsSelected;
        break;
      case "wholesale":
      case "asIs":
        reportedComps = this.propertyService.propertyComps;
        break;
    }

    let selectedMlsNumbers = [];

    if (reportedComps) {
      for (let i = 0; i < reportedComps.length; i++) {
        if (reportedComps[i]) {
          selectedMlsNumbers.push(reportedComps[i].hitMergedResponse.identifier.mlsNumber);
        }
      }
    }

    let payload = {
      proximityInMiles: this.compsFilter.proximityInMiles,
      sqftTotalWithIn: this.compsFilter.sqftTotalWithIn,
      statusChangeInDays: this.compsFilter.statusChangeInDays,
      selectedIds: selectedMlsNumbers,
      includedComps: this.lastResults,
      totalComps: this.compsUniverse.length,
      finalRating: this.propertyService.propertyCompsMeta.analysisRating / 10.0,
      finalValue: +this.propertyService.property.market[this.type]
    };

    if (this.saving) {
      return;
    }

    let flag = this.propertyService.getPropertyFlag('revision_arv');

    if (flag) {
      flag.revisionArv = payload;
    }

    this.saving = true;
    this.notesService.postArv(this.bippoId, payload,
      () => {
        this.saving = false;
        this.loadDescription = "Your ARV Comps Filter settings have been saved";
      },
      (error, caught) => {
        console.error('Failed to save ARV revision for ' + this.bippoId, error);
        this.saving = false;
      });
  }

  recacheColumnProperties(newLoad: boolean, forceNoRevisions: boolean = false) {
    this.columnAdjustments = true;
    this.createBracket = false;
    this.generatedValue = false;
    this.saving = false;

    switch (this.type) {
      case 'wholesale':
        this.columnAdjustments = false;
        // fall-through
      case 'arv':
        this.columnProperties = this.propertyService.propertyCompsSelected;
        this.compsUniverse = this.propertyService.propertyCompsBackground;
        this.createBracket = true;
        break;
      case 'asIs':
        this.compsUniverse = this.columnProperties = this.propertyService.propertyComps;
        break;
      default:
        this.compsUniverse = this.columnProperties = null;
        break;
    }

    let meta = this.propertyService.propertyCompsMeta;
    let filter = Object.assign({}, meta.compsFilterUsed);
    filter.sqftTotalBase = Math.floor((filter.sqftTotalFrom + filter.sqftTotalTo) / 2);
    filter.yearBuiltBase = Math.floor((filter.yearBuiltFrom + filter.yearBuiltTo) / 2);
    this.compsFilter = filter;
    this.adjustmentCategories = meta.adjustmentKey;
    this.adjustmentCatNames = {};

    if (meta.adjustmentKey) for (let c of meta.adjustmentKey) {
      this.adjustmentCatNames[c] = c.replace('_', ' ').toLowerCase();
    }

    // Lazy: could use a tree set and headSet(max.proximityInMiles) or similar instead
    let max = meta.compsFilterMax;
    let proximityOps = [];

    if (max) {
      proximityOps.push(max.proximityInMiles);

      if (max.proximityInMiles > 1) {
        if (max.proximityInMiles > 2) {
          proximityOps.push(2);
        }

        proximityOps.push(1.5);
        proximityOps.push(1);
      }

      proximityOps.push(.75);
      proximityOps.push(.5);
      proximityOps.push(.25);
    }

    let glaOps = [];

    if (max) {
      glaOps.push(max.sqftTotalWithIn);

      if (max.sqftTotalWithIn > 15) {
        if (max.sqftTotalWithIn > 20) {
          if (max.sqftTotalWithIn > 25) {
            glaOps.push(25);
          }

          glaOps.push(20);
        }

        glaOps.push(15);
      }
    }

    let saleOps = [];

    if (max) {
      saleOps.push(max.statusChangeInDays);

      if (max.statusChangeInDays > 180) {
        if (max.statusChangeInDays > 270) {
          saleOps.push(270);
        }

        saleOps.push(180);
      }

      saleOps.push(90);
    }

    this.filterProximity = proximityOps.reverse();
    this.filterGla = glaOps.reverse();
    this.filterSale = saleOps.reverse();

    for (let opt of this.filterProximity) {
      if (opt <= meta.compsFilterUsed.proximityInMiles) {
        this.initialFilter.proximity = +opt;
      } else break;
    }

    for (let opt of this.filterGla) {
      if (opt <= meta.compsFilterUsed.sqftTotalWithIn) {
        this.initialFilter.gla = +opt;
      } else break;
    }

    for (let opt of this.filterSale) {
      if (opt <= meta.compsFilterUsed.statusChangeInDays) {
        this.initialFilter.sale = +opt;
      } else break;
    }

    console.log('ARV defaults: ', this.initialFilter);

    if (this.columnProperties) {
      this.columnPage = this.columnProperties.slice(0, 3); // If length is <= 3, this will simply be the whole array
      this.columnCount = this.columnProperties.length;
      this.columnStart = 0;
    } else {
      this.columnPage = null;
      this.columnCount = 0;
      this.columnStart = 0;
    }

    if (this.type == 'arv' && !forceNoRevisions) {
      let flag = this.propertyService.getPropertyFlag('revision_arv');

      if (flag && flag.revisionArv && !flag.revisionArv.isDefault) {
        console.log('Loading saved ARV Comps Filters', flag.revisionArv);

        // Loading a saved ARV revision's filter settings
        let aimProximity = flag.revisionArv.proximityInMiles;
        let aimGla = flag.revisionArv.sqftTotalWithIn;
        let aimSale = flag.revisionArv.statusChangeInDays;
        let useProximity = 0;
        let useGla = 0;
        let useSale = 0;

        for (let opt of this.filterProximity) {
          if (opt <= aimProximity) {
            useProximity = +opt;
          } else break;
        }

        for (let opt of this.filterGla) {
          if (opt <= aimGla) {
            useGla = +opt;
          } else break;
        }

        for (let opt of this.filterSale) {
          if (opt <= aimSale) {
            useSale = +opt;
          } else break;
        }

        this.setFilterProximity(useProximity, false);
        this.setFilterGla(useGla, false);
        this.setFilterSale(useSale, false);
        this.filterComps();
        this.loadDescription = flag.revisionArv.isDefault ? "Loaded your default ARV Comps Filter settings" : "Loaded your saved ARV Comps Filter settings";
      }
    }
  }

  filterComps() {
    if (this.compsFilter && this.compsUniverse) {
      this.generatedValue = true;
      this.customFiltersPresent = true;
      this.loadDescription = "";

      let glaLow = this.compsFilter.sqftTotalFrom, glaHigh = this.compsFilter.sqftTotalTo, prox = this.compsFilter.proximityInMiles, days = this.compsFilter.statusChangeInDays;
      let newComps = this.compsUniverse.filter(c => c.distance <= prox && c.sale >= 0 && c.sale <= days && c.gla >= glaLow && c.gla <= glaHigh);
      this.lastResults = newComps.length;

      if (this.createBracket) {
        let newBracket = [];

        if (newComps.length < 4) {
          newBracket = newComps.slice();
          this.propertyService.propertyCompsMeta.analysisRating = this.propertyService.propertyCompsMeta.analysisRatingTier = 0;
        } else {
          let workingCopy = newComps.slice();
          let iBest = null, eBest = null, sBest = null;

          for (let i = 0; i < workingCopy.length; i++) {
            if (!workingCopy[i] || !workingCopy[i].rating) {
              continue;
            } else switch (workingCopy[i].rating.type) {
              case 'i':
                if (!iBest || iBest.rating.inferior.overall < workingCopy[i].rating.inferior.overall) {
                  iBest = workingCopy[i];
                }

                break;
              case 'e':
                if (!eBest || eBest.rating.equal.overall < workingCopy[i].rating.equal.overall) {
                  eBest = workingCopy[i];
                }

                break;
              case 's':
                if (!sBest || sBest.rating.superior.overall < workingCopy[i].rating.superior.overall) {
                  sBest = workingCopy[i];
                }

                break;
            }
          }

          if (sBest) workingCopy.splice(workingCopy.indexOf(sBest), 1);
          if (eBest) workingCopy.splice(workingCopy.indexOf(eBest), 1);
          if (iBest) workingCopy.splice(workingCopy.indexOf(iBest), 1);

          if (!sBest) {
            for (let i = 0; i < workingCopy.length; i++) {
              if (!workingCopy[i] || !workingCopy[i].rating) {
                continue;
              } else if (!sBest || sBest.rating.superior.overall < workingCopy[i].rating.superior.overall) {
                sBest = workingCopy[i];
              }
            }

            workingCopy.splice(workingCopy.indexOf(sBest), 1);
          }
          if (!eBest) {
            for (let i = 0; i < workingCopy.length; i++) {
              if (!workingCopy[i] || !workingCopy[i].rating) {
                continue;
              } else if (!eBest || eBest.rating.equal.overall < workingCopy[i].rating.equal.overall) {
                eBest = workingCopy[i];
              }
            }

            workingCopy.splice(workingCopy.indexOf(eBest), 1);
          }
          if (!iBest) {
            for (let i = 0; i < workingCopy.length; i++) {
              if (!workingCopy[i] || !workingCopy[i].rating) {
                continue;
              } else if (!iBest || iBest.rating.inferior.overall < workingCopy[i].rating.inferior.overall) {
                iBest = workingCopy[i];
              }
            }

            workingCopy.splice(workingCopy.indexOf(iBest), 1);
          }

          newBracket.push(sBest, eBest, iBest);

          let avgRating = sBest ? sBest.rating.superior.overall : 0;
          avgRating += eBest ? eBest.rating.equal.overall : 0;
          avgRating += iBest ? iBest.rating.inferior.overall : 0;
          avgRating = Math.floor(avgRating / 3);

          this.propertyService.propertyCompsMeta.analysisRating = avgRating;
          this.propertyService.propertyCompsMeta.analysisRatingTier = Math.floor(avgRating / 25);
        }

        this.columnProperties = newBracket;
        this.propertyService.propertyCompsSelected = newBracket;
        this.propertyService.recacheSelectedComps();
      } else {
        this.columnProperties = newComps;
        this.propertyService.propertyCompsMeta.analysisRating = this.propertyService.propertyCompsMeta.analysisRatingTier = 0;
      }

      console.log("ARV Filter is replacing comps: " + this.propertyService.propertyComps + " with " + newComps);
      this.propertyService.propertyComps = newComps;
      this.recalcValues();

      if (this.columnProperties) {
        this.columnPage = this.columnProperties.slice(0, 3); // If length is <= 3, this will simply be the whole array
        this.columnCount = this.columnProperties.length;
        this.columnStart = 0;
      }
    }
  }

  unfilterComps() {
    this.compsFilter = Object.assign({}, this.propertyService.propertyCompsMeta.compsFilterUsed);
    this.columnProperties = this.propertyService.propertyCompsSelected = this.propertyService.originalCompsSelected;
    this.propertyService.propertyComps = this.propertyService.originalComps;
    this.propertyService.recacheSelectedComps();
    this.recalcValues();
  }

  recalcValues() {
    let averageComps = null;

    switch (this.type) {
      case "arv":
        averageComps = this.propertyService.propertyCompsSelected;
        break;
      case "wholesale":
      case "asIs":
        averageComps = this.propertyService.propertyComps;
        break;
    }

    if (averageComps) {
      let sum = 0;

      for (let i = 0; i < averageComps.length; i++) {
        if (averageComps[i]) {
          sum += averageComps[i].adjustedPrice;
        }
      }

      let newValue = Math.ceil(sum / averageComps.length);

      if (!this.propertyService.propertyCompsMeta[this.type]) {
        this.propertyService.propertyCompsMeta[this.type] = {};
      }

      this.propertyService.propertyCompsMeta[this.type].value = newValue;

      if (this.propertyService.property.market) {
        this.propertyService.property.market[this.type] = newValue;
      }
    }
  }

  shouldReset() {
    return this.compsFilter.proximityInMiles == this.initialFilter.proximity
      && this.compsFilter.sqftTotalWithIn == this.initialFilter.gla
      && this.compsFilter.statusChangeInDays == this.initialFilter.sale;
  }

  setFilterProximity(miles, update: boolean = true) {
    if (this.compsFilter) {
      this.compsFilter.proximityInMiles = +miles;

      if (this.shouldReset()) {
        this.resetArvRevision();
        return;
      }

      if (update) this.filterComps();
    }
  }

  setFilterGla(percent, update: boolean = true) {
    if (this.compsFilter) {
      this.compsFilter.sqftTotalWithIn = +percent;
      this.compsFilter.sqftTotalFrom = (100 + percent) / 100 * this.compsFilter.sqftTotalBase;
      this.compsFilter.sqftTotalFrom = (100 - +percent) / 100 * this.compsFilter.sqftTotalBase;

      if (this.shouldReset()) {
        this.resetArvRevision();
        return;
      }

      if (update) this.filterComps();
    }
  }

  setFilterSale(days, update: boolean = true) {
    if (this.compsFilter) {
      this.compsFilter.statusChangeInDays = +days;

      if (this.shouldReset()) {
        this.resetArvRevision();
        return;
      }

      if (update) this.filterComps();
    }
  }

  isActive() {
    return this._active;
  }

  viewTab() {
    if (this._active && this.bippoId && ((this.propertyService.propertyCompBippoId !== this.bippoId) || (this.propertyService.propertyCompsType !== this.type))) {
      this.busy = [
        this.propertyService.getPropertyCompsData(this.bippoId, this.type, () => {
          console.log('Got property comps data, recaching indexed data..');
          this.recacheColumnProperties(true);
          setTimeout(() => {
            this.brandingActive = false;
          }, 5000);
        }, (error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
        })
      ];
    }
  }

  getCompLabel() {
    switch (this.type) {
      case 'arv':
        return "ARV";
      case 'asIs':
        return "MA";
      case 'wholesale':
        return "Wholesale";
      case 'rent':
        return "Rent";
      default:
        return "";
    }
/*    if (("undefined" !== typeof this.propertyService.propertyCompsType) &&
        (null !== this.propertyService.propertyCompsType) &&
        ("" !== this.propertyService.propertyCompsType)) {
        this.propertyService.getPropertyFlipListPriceTypes();
        for (let x of this.propertyService.propertyFlipListPriceTypes) {
          if (this.propertyService.propertyCompsType === x.value) {
            return x.label;
          }
        }
    }
    return "";*/
  }

  getCompTooltip() {
    switch (this.type) {
      case 'arv':
        return "The HIT After Repair Value (ARV) is the top of the market for a fixed-up property of like kind. Based exclusively on Sold prices it is the upper limit of the subject's best case potential value at the time of the evaluation; it is what the property should appraise for in excellent condition. Relevant fields are aligned and bracketed including gross living area (GLA), year built, lot size, design/construction quality, pools and other core amenities- including bedrooms and bathrooms and adjusted to the subject using paired analysis standards. Proximity and closed date are the first lines of demercation and we will reach out until we have at least 6 sold properties that align with the subject. ARV is always fixed up to the top of the market so no adjustments are made for quality and condition; we seek the top comps and make amenity adjustments only.";
      case 'asIs':
        return "The HIT Market Average (MA) value is aimed for the middle value or middle price tier for the subject - average condition, generally well-maintained and may have some updates 'as needed' but no major remodel. MA assumes the subject and the comps are in like condition and may have one or more latent defects. MA excludes the properties used in HIT's ARV and brackets all the remaining relevant comps to the subject adjusting GLA, lot size, garage spaces, bedrooms, baths and year built as needed. MA might be described as the day to day value or the value as 'lived in and it shows.'";
      case 'wholesale':
        return "For HIT's Wholesale value, we look up to 3 miles from the subject for REO, short sales and other distressed properties within 25% GLA of the subject. Generally, this is considered the bottom of the market for distress in the past 6 or even as long as 12 months. We sort for flip properties and reach back to the original sale and point that out in the comps used. Minor adjustments are made for GLA, garage, and lot size only. This is the bottom of the market, generally for distressed property in poor condition. If we find an obvious 'flip,' then we cite it and use it as one of the base lines by which a wholesale value is measured for this area for properties of like kind.";
      case 'rent':
        return "With HIT Rents, we look for rents within a one to three mile radius of the subject and adjust for bedrooms and school system and identify trends based on elementary schools. Footage and condition differences are weighted to determine a realistic best case scenario; from this base line we pull out the high and the low rental for properties of like kind in this immediate area.";
      default:
        return "";
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

  viewProperty(property: any) {
    this.navigateTo.emit('tab-general');
    setTimeout(() => {
      this.router.navigate(['/property', this.propertyService.getPropertyId(property)]);
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

  formatDate(timestamp) {
    if (timestamp && timestamp > 0) {
      return new Date(timestamp).toLocaleDateString();
    }

    return '';
  }

  pricePerFootage(price, footage) {
    if (!price) {
      return 0;
    }

    return Number(String(price).replace(/\D/g, "")) / Number(String(footage).replace(/\D/g, ""));
  }

  estimatedSalePrice(price, footage) {
    if (!price) {
      return 0;
    }

    let pfootage = Number(String(footage).replace(/\D/g, ""));
    return Math.round(Number(String(price).replace(/\D/g, "")) / pfootage) * pfootage;
  }

  nextPage() {
    this.page++;
  }

  prevPage() {
    this.page--;
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

  formatDaysAgo(days) {
    let d = new Date();
    let t = d.getTime() - days * 86400000;

    d.setTime(t - t % 86400000);

    return d.toLocaleDateString();
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
      return 'Miles ' +      this.formatCompRatingStarEntry(rating.proximity)
              + '<br>Date ' + this.formatCompRatingStarEntry(rating.recency)
              + '<br>GLA ' +     this.formatCompRatingStarEntry(rating.gla)
              + '<br>Year ' +    this.formatCompRatingStarEntry(rating.year);
    }

    return '';
  }

  formatCompRatingStarEntry(rating) {
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
}
