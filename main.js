import { Actor } from 'apify';
import cheerio from 'cheerio';

Actor.main(async () = {
    const input = await Actor.getInput();
    const { telegramUrl } = input;

    console.log(🚀 Telegram gifts scraper started!);
    console.log(📥 Input, input);

    if (!telegramUrl) {
        console.error(❌ telegramUrl is required!);
        return;
    }

     Простейший пример скачиваем страницу и выводим заголовок
    const response = await Actor.newHttpClient().get({ url telegramUrl });
    const html = response.body.toString();
    const $ = cheerio.load(html);

    const title = $(title).text();

    console.log(✅ Страница загружена!);
    console.log(📌 Title, title);

     Сохраняем результат в default dataset (его можно скачать в Apify UI)
    await Actor.pushData({
        url telegramUrl,
        title,
    });

    console.log(🎉 Scraper finished!);
});
