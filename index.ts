import puppeteer from "puppeteer";
import fs from "fs";
import ExcelJS from "exceljs";

//npx ts-node index.ts
(async () => {
  const coins = [
    "BTC-USD", //bitcoin
    "ETH-USD", //ethereum
  ];

  let d = new Date();
  const path = d.toLocaleDateString() + ".xslx";
  const filename = "LRL" + path.split("/");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LRL";
  workbook.lastModifiedBy = "LRL-bot";
  workbook.modified = new Date();

  for (let coin of coins) {
    const datas = await puppeteerMagic(coin);
    console.log(coin, " : Exporting data to file IN PROGRESS.");
    const worksheet = workbook.addWorksheet(coin);
    worksheet.columns = [
      { header: "Date", key: "date" }, //A
      { header: "Open", key: "open" }, //B
      { header: "High", key: "high" }, //C
      { header: "Low", key: "low" }, //D
      { header: "Close", key: "close" }, //E
      { header: "AdjClose", key: "adjClose" }, //F
      { header: "Volume", key: "volume" }, //G
      { header: "Percent of Change", key: "poc" }, //H
    ];

    const close90Days = [];
    const open90Days = [];
    const percetageOfChange = [];
    const rowValues = [];

    for (let i = 0; i <= 90; i++) {
      const data = datas[i].split("\t");
      for (let y = 0; y <= data.length; y++) {
        rowValues[y] = data[y];
        if (y == 1) {
          open90Days.push(parseFloat(data[y].replace(/,/g, "")));
        }
        if (y == 4) {
          close90Days.push(parseFloat(data[y].replace(/,/g, "")));
        }
        console.log(`${coin} : Exported data ${i}`);
      }
      worksheet.addRow(rowValues);
    }

    //compute mean/average
    const getValueOfMean = (array: number[]) =>
      array.reduce((a, b) => a + b) / array.length;
    console.log(coin, " : Mean/Average computation COMPLETED.");

    //stdev
    let getValueOfStdev = (data: number[]) => {
      let m = getValueOfMean(data);
      return Math.sqrt(
        data.reduce(function (sq, n) {
          return sq + Math.pow(n - m, 2);
        }, 0) /
          (data.length - 1)
      );
    };
    console.log(coin, " : STDEV computation COMPLETED.");

    //compute percentage of change
    let cellPosition = Number(1);
    for (let i = 0; i < close90Days.length; i++) {
      //close divided by open
      cellPosition++;
      percetageOfChange.push(Number(close90Days[i] / open90Days[i]));
      worksheet.getCell(`H${cellPosition}.tostring()`).value =
        percetageOfChange[i];
      console.log(`${coin} : Determine percent of change for data ${i}`);
    }

    //compute for stdev1, 2 and 3
    worksheet.getCell("J2").value = "STDEV+3";
    worksheet.getCell("K2").value =
      getValueOfMean(close90Days) + getValueOfStdev(close90Days) * 3;

    worksheet.getCell("J3").value = "STDEV+2";
    worksheet.getCell("K3").value =
      getValueOfMean(close90Days) + getValueOfStdev(close90Days) * 2;

    worksheet.getCell("J4").value = "STDEV+1";
    worksheet.getCell("K4").value =
      getValueOfMean(close90Days) + getValueOfStdev(close90Days);

    worksheet.getCell("J5").value = "AVERAGE";
    worksheet.getCell("K5").value = getValueOfMean(close90Days);

    worksheet.getCell("J6").value = "STDEV-1";
    worksheet.getCell("K6").value =
      getValueOfMean(close90Days) - getValueOfStdev(close90Days);

    worksheet.getCell("J7").value = "STDEV-2";
    worksheet.getCell("K7").value =
      getValueOfMean(close90Days) - getValueOfStdev(close90Days) * 2;

    worksheet.getCell("J8").value = "STDEV-3";
    worksheet.getCell("K8").value =
      getValueOfMean(close90Days) - getValueOfStdev(close90Days) * 3;

    const stdev =
      (getValueOfStdev(close90Days) / getValueOfMean(close90Days)) * 100;
    worksheet.getCell("J9").value = "STDEV %";
    worksheet.getCell("K9").value = parseFloat(stdev.toString()).toFixed(2);

    const stdev2 = stdev * 2;
    worksheet.getCell("J10").value = "STDEV2 %";
    worksheet.getCell("K10").value = parseFloat(stdev2.toString()).toFixed(2);

    const roundedStdev2 = parseFloat(stdev2.toString()).toFixed(2);
    const leverage =
      200 / parseFloat(roundedStdev2.toString().replace("%", ""));

    worksheet.getCell("J11").value = "MAX LEVERAGE";
    worksheet.getCell("K11").value = parseFloat(leverage.toString()).toFixed(0);

    console.log(coin, " : Exporting data to file COMPLETED.");
  }
  await workbook.xlsx.writeFile(filename);
  await new Promise((r) => setTimeout(r, 2000));
})();

function return90DaysDate() {
  let d = new Date();
  d.setDate(d.getDate() - 90);
  const date = d.toString().split(" ");
  const date90Days = date[1] + " " + date[2] + ", " + date[3];
  return date90Days.toString();
}

/*
  Response:
  Date, Open, High, Low, Close, Adj Close*, Volume
*/
async function puppeteerMagic(target: string): Promise<String[]> {
  console.log("Processing historical data for ", target);
  const browser = await puppeteer.launch({
    // headless: false,
    defaultViewport: {
      width: 1800,
      height: 1800,
    },
  });
  const page = await browser.newPage();
  await page.goto(
    `https://finance.yahoo.com/quote/${target}/history?p=${target}`
  );
  let closePrice =
    '//table[@data-test="historical-prices"]//tbody//tr[2]//td[5]//span';
  console.log("90 Days Date: ", return90DaysDate());
  const datas = await page.$$eval("table tbody tr", (tds) =>
    tds.map((td) => {
      return (td as HTMLElement).innerText;
    })
  );
  // console.log(datas);
  await browser.close();
  return datas;
}
