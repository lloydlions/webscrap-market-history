import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    defaultViewport: {
      width: 1800,
      height: 1800,
    },
  });

  const page = await browser.newPage();

  await page.goto("https://finance.yahoo.com/quote/BTC-USD/history?p=BTC-USD");
  let closePrice =
    '//table[@data-test="historical-prices"]//tbody//tr[2]//td[5]//span';

  console.log("90 Days Date: ", return90DaysDate());
  const datas = await page.$$eval("table tbody tr", (tds) =>
    tds.map((td) => {
      return (td as HTMLElement).innerText;
    })
  );

  console.log(datas);
  for (let i = 0; i <= 90; i++) {
    //   //Date
    //   //Open
    //   //High
    //   //Low
    //   //Close
    //   //Adj Close*
    //   //Volume
    const data = datas[i].split("\t");
    console.log("DAtA: ", data[4]);
  }

  await browser.close();
})();

function return90DaysDate() {
  let d = new Date();
  d.setDate(d.getDate() - 90);
  const date = d.toString().split(" ");
  const date90Days = date[1] + " " + date[2] + ", " + date[3];
  return date90Days.toString();
}
