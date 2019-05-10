import * as https from "https";

export class Market {
  api = "https://bittrex.com/api/v1.1/public";

  getSummaries() {
    const url = this.api + "/getmarketsummaries";
    https.get(url, response => {
      console.log(response);
    });
  }
}
