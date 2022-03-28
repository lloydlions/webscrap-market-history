import puppeteer from "puppeteer";
import fs from "fs";
import ExcelJS from "exceljs";

//npx ts-node index.ts
(async () => {
  const coins = [
    "BTC-USD", //bitcoin
    // "ETH-USD", //ethereum
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
      { header: "Date", key: "date" },
      { header: "Open", key: "open" },
      { header: "High", key: "high" },
      { header: "Low", key: "low" },
      { header: "Close", key: "close" },
      { header: "AdjClose", key: "adjClose" },
      { header: "Volume", key: "volume" },
    ];

    const close90Days = [];
    const open90Days = [];
    const percetageOfChange = [];

    for (let i = 0; i <= 90; i++) {
      const data = datas[i].split("\t");
      const rowValues = [];
      for (let y = 0; y <= data.length; y++) {
        rowValues[y] = data[y];
        if (y == 1) {
          open90Days.push(parseFloat(data[y].replace(/,/g, "")));
        }
        if (y == 4) {
          close90Days.push(parseFloat(data[y].replace(/,/g, "")));
        }
      }
      worksheet.addRow(rowValues);
      console.log(`${coin} : Exported data ${i}`);
    }

    //compute mean/average
    const getValueOfMean = (array: number[]) =>
      array.reduce((a, b) => a + b) / array.length;

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

    //compute percentage of change
    for (let i = 0; i < close90Days.length; i++) {
      //close divided by open
      percetageOfChange.push(Number(close90Days[i] / open90Days[i]));
    }

    console.log(coin, " : Exporting data to file COMPLETED.");
  }
  await workbook.xlsx.writeFile(filename);
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
    "https://finance.yahoo.com/quote/BTC-USD/history?p=" + target
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
