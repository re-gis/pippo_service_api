import { Component, OnInit, NgModule, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
declare let google: any;

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-simple-search',
  templateUrl: 'simple-search.component.html',
  styleUrls: ['simple-search.component.css']
})

@NgModule({
  imports: [
    FormsModule
  ]
})

export class SimpleSearchComponent implements OnInit {
  address: any;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ){}

  onSubmit(searchQuery: any) {
      // this.router.navigate(['WatchlistComponent']);
      this.router.navigate(['/simple-search-results', searchQuery.simple_search]);
  }

  ngOnInit() {
    setTimeout(() => this.setupGoogleMapsAutocomplete(), 1000);
  }

  setupGoogleMapsAutocomplete() {
    if (!google) {
      setTimeout(() => this.setupGoogleMapsAutocomplete(), 2000);
      return false;
    }

    let searchBox: any = (<HTMLInputElement>document.getElementById('simple_search'));
    var autocomplete = new google.maps.places.Autocomplete(searchBox, { types: ['address'] });

    autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
            this.address = searchBox.value;
        });
    });

    return true;
  }
}
