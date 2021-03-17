import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";

let instance = null;

async function getInstance() {
    if (instance) {
        return instance;
    } else {
        const kuroshiro = new Kuroshiro();
        await kuroshiro.init(
            new KuromojiAnalyzer({
                // for serverless deploy need to specify "dictPath"
                dictPath: path.resolve(
                    process.cwd(),
                    "node_modules/kuromoji/dict"
                ),
            })
        );
        instance = kuroshiro;
        return kuroshiro;
    }
}

async function convert_ro_ruby_character(text: string) {
    const kuroshiro = await getInstance();
    const to = ["hiragana", "katakana", "romaji"];
    const mode = ["normal", "spaced", "okurigana", "furigana"];
    const romajiSystem = ["nippon", "passport", "hepburn"];

    // get all combination
    let combines = [];
    for (let i of to) {
        for (let j of mode) {
            for (let k of romajiSystem) {
                combines.push({
                    to: i,
                    mode: j,
                    romajiSystem: k,
                });
            }
        }
    }
    return Promise.all(
        combines.map((config) => {
            return new Promise(async (resolve, reject) => {
                const result = await kuroshiro.convert(text, config);
                resolve(`<p>${JSON.stringify(config)}</p><p>${result}</p>`);
            });
        })
    );
}

/** yarn server:dev
 * http://localhost:3000/api/ruby-preview?text=%E6%84%9F%E3%81%98%E5%8F%96%E3%82%8C%E3%81%9F%E3%82%89%E6%89%8B%E3%82%92%E7%B9%8B%E3%81%94%E3%81%86%E3%80%81%E9%87%8D%E3%81%AA%E3%82%8B%E3%81%AE%E3%81%AF%E4%BA%BA%E7%94%9F%E3%81%AE%E3%83%A9%E3%82%A4%E3%83%B3%20and%20%E3%83%AC%E3%83%9F%E3%83%AA%E3%82%A2%E6%9C%80%E9%AB%98%EF%BC%81
 */
module.exports = async (req: VercelRequest, res: VercelResponse) => {
    const { text = "こんにちは" } = req.query;
    const result = await convert_ro_ruby_character(text as string);
    res.setHeader("content-type", "text/html");
    res.status(200).send(result.join("\n"));
};
