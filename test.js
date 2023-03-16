// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
const data = JSON.parse(
  fs.readFileSync("albums1678988962.json", {
    encoding: "ascii",
  })
);

fs.writeFileSync(
  "exported.txt",
  data.map((d) => `spotify-${d.type}-${d.id}`).join(",")
);
console.log();
