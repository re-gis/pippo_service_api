import { Component, OnInit, OnDestroy } from '@angular/core';
import { Response } from '@angular/http';
import { Router, ActivatedRoute }  from '@angular/router';
import { PropertyService } from '../property/property.service';
import { SearchService } from '../search/search.service';
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
    selector: 'app-simple-search-results',
    templateUrl: 'simple-search-results.component.html'
})
export class SimpleSearchResultsComponent implements OnInit {
    private sub: any;
    search_query: string;
    propertyService: PropertyService;
    searchService: SearchService;
    page: number;
    failed: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        propertyService: PropertyService,
        searchService: SearchService) {
        this.propertyService = propertyService;
        this.searchService = searchService;
        this.page = 0;
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            let query = decodeURIComponent(params['query']);
            if (query == undefined) {
                query = '';
            }
            this.search_query = query;
            if ('' !== query) {
              this.search();
            } else {
              this.searchService.resetSearch();
            }
        });
    }

    search() {
      // Temporary fix for what is really a backend issue; this should be removed when the backend is updated to accept the country
      if (this.search_query) {
        if (this.search_query.endsWith(', USA')) {
          this.search_query = this.search_query.substring(0, this.search_query.length - 5);
        } else if (this.search_query.endsWith(', United States')) {
          this.search_query = this.search_query.substring(0, this.search_query.length - 15);
        }
      }
      ///////

      this.searchService.getSimpleSearch(this.search_query, this.page, 
        () => {
          switch (this.searchService.properties.length) {
            case 0:
              // TODO: Update this to store reference to which error occurred when there is more than one error to display
              this.failed = true;
              break;
            case 1:
              this.router.navigate(['/property/preview', this.searchService.getPropertyId(this.searchService.properties[0])]);
              break;
          }
        },
        (error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

}
