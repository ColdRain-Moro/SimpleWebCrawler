import fs from 'fs';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

function generateUrl(tag, sort, limit, offset) {
    return `https://movie.douban.com/j/search_subjects?type=movie&tag=${encodeURI(tag)}&sort=${sort}&page_limit=${limit}&page_start=${offset}`;
}
const data = [];

// 爬一次豆瓣就把我ip封了, 淦
(async function () {
    // 先爬个100个电影
    for (let i = 0; i < 5; i++) {
        const res = await fetch(generateUrl('热门', 'recommend', 20, 0 + 20 * i)).then(res => res.json());
        const list = res.subjects

        list.forEach(async item => {
            const d = {
                title: item.title,
                id: item.id,
                rate: item.rate,
                cover: item.cover,
            }
            const url = item.url
            const html = await fetch(url).then(res => res.text());
            const $ = cheerio.load(html)
            // 爬 导演 编剧 主演 类型 地区 语言 日期 片长 IMDb 简介
            const director = $('#info .attrs').eq(0).find("a").text()
            const screenWriters = $('#info span .attrs').eq(1)
                .find("a")
                .map((i, item) => {
                    return $(item).text()
                })
                .get()
            const actors = $('#info span .attrs').eq(2)
                .find("span a")
                .map((i, item) => {
                    return $(item).text()
                })
                .get()
            const type = $('.pl').eq(3).nextAll("span[property='v:genre']")
                .map((i, item) => {
                    return $(item).text()
                })
                .get()
            const date = $('.pl').eq(6).next("span[property='v:initialReleaseDate']").text()
            const duration = $('.pl').eq(7).next("span[property='v:runtime']").text()

            const desc = $("span[property='v:summary']").text()
            const celebrities = $(".celebrities-list .celebrity").map((i, item) => {
                const obj = $(item)
                return {
                    url: obj.find("a").attr("href"),
                    avatar: obj.find("a .avatar").css("background-image"),
                    name: obj.find(".info .name a").text(),
                    role: obj.find(".info .role").text()
                }
            }).get()
            d.url = url
            d.director = director
            d.screenWriters = screenWriters
            d.actors = actors
            d.type = type
            d.date = date
            d.duration = duration
            d.desc = desc
            d.celebrities = celebrities
            data.push(d)
        })
    }

    fs.writeFileSync('./data.json', JSON.stringify(data, null, 3))
})();






