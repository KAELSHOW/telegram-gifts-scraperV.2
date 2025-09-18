import { Actor, PlaywrightCrawler } from "apify";

await Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        fragmentUrl = "https://fragment.com/gifts",
        maxItems = 50,
        includeRare = true,
        saveImages = false,
        outputFormat = "json"
    } = input;

    Actor.log.info(`Открываю ${fragmentUrl}...`);

    const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        async requestHandler({ page }) {
            await page.goto(fragmentUrl, { waitUntil: "networkidle" });

            // ждём карточки подарков
            await page.waitForSelector(".gift-item, .TableRow");

            const gifts = await page.$$eval(".gift-item, .TableRow", (els, opts) => {
                const results = [];
                for (let i = 0; i < els.length && results.length < opts.maxItems; i++) {
                    const el = els[i];
                    const name = el.querySelector(".gift-name, .ItemLotTitle")?.innerText.trim();
                    const price = el.querySelector(".gift-price, .ItemLotPrice")?.innerText.trim();
                    const rarity = el.querySelector(".gift-rarity")?.innerText.trim() || "обычный";
                    const img = el.querySelector("img")?.src;

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

            Actor.log.info(`Собрано ${gifts.length} подарков`);
            await Actor.pushData(gifts);
            await Actor.setValue("OUTPUT", gifts);
        }
    });

    await crawler.run([{ url: fragmentUrl }]);
});
