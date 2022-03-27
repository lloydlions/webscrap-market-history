import puppeteer from "puppeteer";
import fs from "fs";
import ExcelJS from "exceljs";

//npx ts-node index.ts
(async () => {
  const coins = [
    "BTC-USD", //bitcoin
  ];

  let instance = 0;

  let d = new Date();
  const path = d.toLocaleDateString() + ".xslx";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LRL";
  workbook.lastModifiedBy = "LRL-bot";
  workbook.modified = new Date();

  //loop through all coins
  for (let coin of coins) {
    const datas = await puppeteerMagic(coin);
    instance++;

    const worksheet = workbook.addWorksheet(coin);

    worksheet.getCell("A" + instance.toString()).value = "Date";
    worksheet.getCell("B" + instance.toString()).value = "Open";
    worksheet.getCell("C" + instance.toString()).value = "High";
    worksheet.getCell("D" + instance.toString()).value = "Low";
    worksheet.getCell("E" + instance.toString()).value = "Close";
    worksheet.getCell("F" + instance.toString()).value = "Adj Close";
    worksheet.getCell("G" + instance.toString()).value = "Volume";

    //loop each response
    for (let i = 0; i <= 90; i++) {
      //   //Date
      //   //Open
      //   //High
      //   //Low
      //   //Close
      //   //Adj Close*
      //   //Volume
      const data = datas[i].split("\t");
      const counter = Number(instance) + Number(i);

      worksheet.getCell("A" + counter.toString()).value = "Date";
      worksheet.getCell("B" + counter.toString()).value = "Open";
      worksheet.getCell("C" + counter.toString()).value = "High";
      worksheet.getCell("D" + counter.toString()).value = "Low";
      worksheet.getCell("E" + counter.toString()).value = "Close";
      worksheet.getCell("F" + counter.toString()).value = "Adj Close";
      worksheet.getCell("G" + counter.toString()).value = "Volume";

      //@TODO: write to file
    }
  }
})();

function return90DaysDate() {
  let d = new Date();
  d.setDate(d.getDate() - 90);
  const date = d.toString().split(" ");
  const date90Days = date[1] + " " + date[2] + ", " + date[3];
  return date90Days.toString();
}

async function puppeteerMagic(target: string): Promise<String[]> {
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
  await browser.close();
  return datas;
}
