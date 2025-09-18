import { Actor, PlaywrightCrawler } from "apify";

await Actor.main(async () => {
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
            Actor.log.info("Открываю страницу...");
            await page.goto(fragmentUrl, { waitUntil: "networkidle" });

            Actor.log.info("Жду появления карточек...");
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

            Actor.log.info(`Собрано подарков: ${gifts.length}`);
            await Actor.pushData(gifts);
            await Actor.setValue("OUTPUT", gifts);
        }
    });

    await crawler.run([{ url: fragmentUrl }]);
});
