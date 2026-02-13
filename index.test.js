const fetch = require('node-fetch');
const fs = require('fs');
const { getPrice, generate } = require('./index');

jest.mock('node-fetch');
jest.mock('fs');

describe('btc-daily', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DENO_URL = 'http://deno.url';
    process.env.DATABASE_ID = 'db_id';
  });

  describe('getPrice', () => {
    it('should return price and date when API call is successful', async () => {
      const mockData = { price: '50000.123' };
      fetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockData),
      });

      const result = await getPrice();

      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('price', '50000.12');
      expect(fetch).toHaveBeenCalledWith(
        "https://api.binance.us/api/v3/ticker/price?symbol=BTCUSDT"
      );
    });

    it('should return empty object when API call fails', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getPrice();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('API Error');

      consoleSpy.mockRestore();
    });
  });

  describe('generate', () => {
    it('should append to file and call deno webhook when price is fetched', async () => {
      const mockData = { price: '60000.00' };
      // Mock the first fetch call (getPrice)
      fetch.mockReturnValueOnce(Promise.resolve({
        json: jest.fn().mockResolvedValue(mockData),
      }));
      // Mock the second fetch call (deno webhook)
      fetch.mockReturnValueOnce(Promise.resolve({}));

      await generate();

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        "README.md",
        expect.stringMatching(/\| \d{4}-\d{2}-\d{2} \| 60000.00 \|\r\n/)
      );

      const expectedDenoUrl = `${process.env.DENO_URL}?db=${process.env.DATABASE_ID}&today=60000.00`;
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(expectedDenoUrl);
    });

    it('should not append to file if price is not fetched', async () => {
      fetch.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await generate();

      expect(fs.appendFileSync).not.toHaveBeenCalled();
      // fetch is called once for getPrice
      expect(fetch).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });
});
