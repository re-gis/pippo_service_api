export class SearchModel {
  bathsFrom: number;
  bathsTo: number;
  bedsFrom: number;
  bedsTo: number;
  carportBaysFrom: number;
  carportBaysTo: number;
  cdomFrom: number;
  cdomTo: number;
  city: string;
  condition: string;
  conditionConfidenceScoreFrom: number;
  conditionConfidenceScoreTo: number;
  county: string;
  diningAreasFrom: number;
  diningAreasTo: number;
  domFrom: number;
  domTo: number;
  garageBaysFrom: number;
  garageBaysTo: number;
  halfBathsFrom: number;
  halfBathsTo: number;
  hitArvFrom: number;
  hitArvTo: number;
  hitAsIsFrom: number;
  hitAsIsTo: number;
  hitRentFrom: number;
  hitRentTo: number;
  hitWholesaleFrom: number;
  hitWholesaleTo: number;
  hoaFrom: number;
  hoaTo: number;
  hud: boolean;
  listPriceFrom: number;
  listPriceTo: number;
  livingAreasFrom: number;
  livingAreasTo: number;
  lotFrom: number;
  lotTo: number;
  mlsStatus: Array<string>;
  numberOfStories: number;
  pool: boolean;
  priceRangeFrom: number;
  priceRangeTo: number;
  propertyType: Array<string>;
  propertySubType: Array<string>;
  schoolDistrict: Array<string>;
  sqftFrom: number;
  sqftTo: number;
  statusChangeTimestampFrom: any;
  statusChangeDateFrom: any;
  statusChangeTimestampTo: any;
  statusChangeDateTo: any;
  taxValueFrom: number;
  taxValueTo: number;
  zipCodes: Array<string>;
  andWords: Array<string>;
  notWords: Array<string>;
  mlsRegion: string;
  searchName: string;
  searchid: string;
  page: number;
  size: number;

  constructor(data?: any) {
    if ("undefined" !== typeof data) {
      this.update(data);
    }
  }

  reset() {
    for (let x in this) {
      switch (x) {
        case "mlsRegion":
          continue;
        default:
          break;
      }

      switch (typeof this[x]) {
        case "number":
        case "string":
        case "boolean":
          this[x] = null;
          break;
        case "object":
          switch (x) {
            case "mlsStatus":
            case "propertyType":
            case "propertySubType":
            case "schoolDistrict":
            case "zipCodes":
            case "andWords":
            case "notWords":
              this[x] = [];
              break;
          }

          break;
      }
    }
  }

  update(data: any) {
    for (let x in data) {
      this[x] = data[x];
    }
  }
}
