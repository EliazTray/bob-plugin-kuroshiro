function supportLanguages() {
    // 只有日文是有效的，但是可能识别为中文，所以避免被主程序误杀，写上常用的。
    return ['auto', 'ja', 'zh-Hans', 'zh-Hant', 'en']
}

/**
 * @callback completion
 * @param {success|failure} success
 */

/**
 * @typedef {Object} success
 * @property {Object} success.result
 * @property {string} success.result.from 由翻译接口提供的源语言，可以与查询时的 from 不同
 * @property {string} success.result.to 由翻译接口提供的源语言，可以与查询时的 from 不同
 * @property {string} success.result.from 由翻译接口提供的目标语言，可以与查询时的 to 不同
 * @property {string[]} success.result.fromParagraphs 原文分段拆分过后的 string 数组，可不传。
 * @property {string[]} success.result.toParagraphs 译文分段拆分过后的 string 数组，必传。
 * @property {Object} success.result.toDict 词典结果，见 to dict object。可不传
 * @property {Object} success.result.fromTTS 原文的语音合成数据，如果没有，可不传。
 * @property {Object} success.result.toTTS 译文的语音合成数据，如果没有，可不传。
 * @property {any} success.result.raw
 */

/**
 * @typedef {Object} failure
 * @property {Object} failure.error
 * @property {string} failure.error.type
 * @property {string} failure.error.message
 *
 */

/**
 *
 * @param {Object} query
 * @param {string} query.text 需要翻译的文本。
 * @param {string} query.from 用户选中的源语言代码，可能是 auto
 * @param {string} query.to 用户选中的目标语言代码，可能是 auto
 * @param {string} query.detectFrom 检测过后的源语言，一定不是 auto，如果插件不具备检测语言的能力，可直接使用该属性。
 * @param {string} query.detectTo 检测过后的目标语言，一定不是 auto，如果不想自行推测用户实际需要的目标语言，可直接使用该属性。
 * @param {completion} completion
 */

function translate(query, completion) {
    $log.info(JSON.stringify(query))
    $http.get({
        url: 'https://ruby-character.vercel.app/api/ruby',
        body: {
            text: query.text,
            to: $option.to,
            mode: $option.mode,
            romajiSystem: $option.romajiSystem,
        },
        timeout: 3000,
        handler: function (resp) {
            $log.info(JSON.stringify(resp))
            if (resp.response.statusCode === 200) {
                const data = resp.data
                completion({
                    result: {
                        toParagraphs: [data[0]],
                        toDict: {
                            addtions: [
                                {
                                    name: '罗马字',
                                    value: data[1],
                                },
                            ],
                        },
                    },
                })
            } else {
                completion({
                    error: {
                        type: 'network',
                        message: resp.error.localizedDescription
                    }
                })
            }
        },
    })
}
