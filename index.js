require('dotenv').config();
const fetch = require("node-fetch");
const fs = require("fs");

const getPrice = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      "https://api.binance.us/api/v3/ticker/price?symbol=BTCUSDT"
    );
    const data = await response.json();
    console.log("data", data);
    const price = parseFloat(data.price).toFixed(2);

    // console.log("today", today);
    // console.log("price", price);

    return {
      today,
      price,
    };
  } catch (err) {
    console.error(err.message);
    return {};
  }
};

const generate = async () => {
  const { today, price } = await getPrice();

  if (!price) return;

  fs.appendFileSync("README.md", `| ${today} | ${price} |\r\n`);

  const deno = `${process.env.DENO_URL}?db=${process.env.DATABASE_ID}&today=${price}`;
  console.log('deno', deno);

  await fetch(deno);
};

if (require.main === module) {
  generate();
}

module.exports = {
  getPrice,
  generate
};
