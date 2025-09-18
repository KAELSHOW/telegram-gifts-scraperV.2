const { Actor } = require('apify');
const axios = require('axios');
const cheerio = require('cheerio');

Actor.main(async () => {
    const input = await Actor.getInput();

    // параметры из INPUT_SCHEMA.json
    const {
        telegramUrl = "https://telegram.org/gifts",
        maxItems = 50,
        includeRare = true,
        saveImages = false,
        outputFormat = "json"
    } = input || {};

    Actor.log.info(`Собираем подарки с: ${telegramUrl}`);

    // Загружаем страницу
    const { data: html } = await axios.get(telegramUrl);
    const $ = cheerio.load(html);

    const results = [];

    $(".gift_card").each((i, el) => {
        if (i >= maxItems) return false; // ограничение

        const name = $(el).find(".gift_name").text().trim();
        const price = $(el).find(".gift_price").text().trim();
        const rarity = $(el).find(".gift_rarity").text().trim();
        const img = $(el).find("img").attr("src");

        // фильтр: исключаем редкие, если includeRare = false
        if (!includeRare && rarity.toLowerCase() === "rare") return;

        results.push({
            name,
            price,
            rarity,
            image: saveImages ? img : undefined,
            url: telegramUrl
        });
    });

    await Actor.pushData(results);

    Actor.log.info(`✅ Собрано ${results.length} подарков`);
});
