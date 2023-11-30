import { Component, OnInit, OnDestroy } from '@angular/core';
import { Response } from '@angular/http';
import { Router, ActivatedRoute }  from '@angular/router';
import { SearchService } from '../search/search.service';
import { PaginationService, IPaginationInstance } from '../ng2-pagination/ng2-pagination';
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
    selector: 'app-craigslist-list',
    templateUrl: 'craigslist-list.component.html'
})
export class CraigslistListComponent implements OnInit {
    private sub: any;
    search_query: string;
    query_params: any;
    region: string;
    searchService: SearchService;
    page: number;
    totalPages: number = 1;

    constructor(
            private route: ActivatedRoute,
            private router: Router,
            searchService: SearchService) {

        this.searchService = searchService;
        this.page = 1;
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
            this.page = this.query_params["page"] || 1;
            this.region = this.query_params["region"];

            if (this.region) {
              this.search();
            }
        });
    }

    prevPage() {
      if (this.page <= 1) {
        return;
      }

      this.page--;
      this.search();
    }

    nextPage() {
      if (this.page >= this.searchService.craigslistPageMax) {
        return;
      }

      this.page++;
      this.search();
    }

    search() {
      this.searchService.getCraigslistPage(this.region, this.page, () => {
        this.totalPages = this.searchService.craigslistPageMax;
      }, (error:any, caught: Observable<any>) => {
        console.log(error);
        return caught;
      });
    }

    ngOnDestroy() {
      this.sub.unsubscribe();
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

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    }
}
