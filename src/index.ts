import { Program } from "./program";

const prog = new Program();
prog.onStart();

process.on("SIGINT", () => {
  prog.onStop();
});
