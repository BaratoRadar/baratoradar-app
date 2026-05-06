import { exec } from "child_process";

const scrapers = [
  "npm run scrape:zaffari",
  // "npm run scrape:carrefour",
];

scrapers.forEach((cmd) => {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(`Erro: ${cmd}`, err);
      return;
    }

    console.log(`OK: ${cmd}`);
    console.log(stdout);
  });
});