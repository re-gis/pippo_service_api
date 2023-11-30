import { Component, OnInit, OnDestroy } from '@angular/core';
import { Response } from '@angular/http';
import { Router, ActivatedRoute }  from '@angular/router';
import { SearchService } from '../search/search.service';
import { PropertyService } from '../property/property.service';
import { IPaginationInstance } from '../ng2-pagination/ng2-pagination';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';


export interface PagedResponse<T> {
    total: number;
    data: T[];
}

export interface DataModel {
    id: number;
    data: string;
}

@Component({
  //   moduleId: module.id.toString(),
    selector: 'app-auction-search-results',
    templateUrl: 'auction-search-results.component.html'
})
export class AuctionSearchResultsComponent implements OnInit {
    private sub: any;
    search_query: string;
    query_params: any;
    county: string;
    page: number;
    private summaryProperty: string = null;

    constructor(
            private route: ActivatedRoute,
            private router: Router,
            private searchService: SearchService,
            private propertyService: PropertyService) {

        this.page = 0;
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            let query = decodeURIComponent(params['query']);

            if (query == undefined) {
                query = '';
            }

            this.search_query = query;
            this.query_params = this.parseRawQueryString(query);
            console.log('query_params', this.query_params);
            this.county = this.query_params["county"];

            if ('' !== query) {
              this.search();
            } else {
              this.searchService.resetSearch();
            }
        });
    }

    search() {
console.log('auction search', this.search_query, this.page);
      this.searchService.getAuctionSearch(this.search_query, this.page, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    viewPropertyByIndex(index) {
      this.searchService.viewProperty(index, this.router);
    }

    parseRawQueryString(query) {
      let urlParams = {};
      let search = /([^&=]+)=?([^&]*)/g;
      let match;

      while (match = search.exec(query)) {
         urlParams[this.decode(match[1])] = this.decode(match[2]);
      }

      return urlParams;
    }

    decode(input) {
      return decodeURIComponent(input.replace(/\+/g, " "));
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

    omitNullString(s) {
      return s && s !== "null" ? s : '—';
    }

    omitNullStringOrZero(s) {
      let n;
      return s && s !== "null" && (n = Number(s)) ? n.toLocaleString() : '—';
    }

    omitZero(s) {
      let n;
      return s && (n = Number(s)) ? n.toLocaleString() : '—';
    }

    formatDate(t) {
      return new Date(t).toLocaleDateString();
    }
}
