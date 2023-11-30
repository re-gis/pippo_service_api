import { Component, OnInit, Input } from '@angular/core';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-dashboard-search',
  templateUrl: 'dashboard-search.component.html',
  styleUrls: ['search.component.css']
})
export class DashboardSearchComponent implements OnInit {
  activeTab: string;
  _plain: boolean = false;
  _hideable: boolean = false;
  hidden: boolean = false;
  padding: string = null;

  @Input()
  set plain(isPlain: boolean) {
    this._plain = isPlain;
  }
  @Input()
  set hideable(isHideable: boolean) {
    this._hideable = isHideable;
    this.padding = isHideable ? '0' : null;
  }

  constructor() {}

  ngOnInit() {
    this.activeTab = 'simple';
  }

  displayActiveTab() {
    switch (this.activeTab) {
      case 'toggle-hide':
        this.hidden = true;
        break;
      case 'toggle-show':
        this.hidden = false;
        break;
    }
  }
}
