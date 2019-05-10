import { Market } from "./market";

export class Program {
  interval: NodeJS.Timer;
  market: Market;

  constructor() {
    this.market = new Market();
  }

  mainLoop() {
    console.log("execution de la boucle principale");
    this.market.getSummaries();
  }

  onStart() {
    console.log("préparation du programme");
    this.interval = setInterval(this.mainLoop.bind(this), 10000);
    this.mainLoop();
  }

  onStop() {
    console.log("fin du programme");
    clearInterval(this.interval);
  }
}
