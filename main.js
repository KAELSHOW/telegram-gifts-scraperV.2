const { Actor, PlaywrightCrawler } = require("apify");

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        fragmentUrl = "https://fragment.com/gifts",
        maxItems = 50,
        includeRare = true,
        saveImages = false,
        outputFormat = "json"
    } = input || {};

    Actor.log.info(`Запуск скрейпера: ${fragmentUrl}`);

    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        async requestHandler({ page }) {
            await page.goto(fragmentUrl, { waitUntil: "networkidle" });

            await page.waitForSelector(".TableRow", { timeout: 30000 });

            const gifts = await page.$$eval(".TableRow", (rows, opts) => {
                const results = [];
                for (let i = 0; i < rows.length && results.length < opts.maxItems; i++) {
                    const row = rows[i];
                    const name = row.querySelector(".ItemLotTitle")?.innerText.trim();
                    const price = row.querySelector(".ItemLotPrice")?.innerText.trim();
                    const rarity = row.querySelector(".gift-rarity")?.innerText.trim() || "обычный";
                    const img = row.querySelector("img")?.src;

                    if (!opts.includeRare && rarity.toLowerCase().includes("rare")) continue;

                    results.push({
                        name,
                        price,
                        rarity,
                        image: opts.saveImages ? img : undefined,
                    });
                }
                return results;
            }, { includeRare, saveImages, maxItems });

            await Actor.pushData(gifts);
            await Actor.setValue("OUTPUT", gifts);
        }
    });

    await crawler.run([{ url: fragmentUrl }]);
});
