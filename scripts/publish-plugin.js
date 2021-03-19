const semver = require('semver')
const { prompt } = require('enquirer')
const execa = require('execa')
const ora = require('ora')
const path = require('path')
const fs = require('fs-extra')
const createHash = require('crypto').createHash
const tempy = require('tempy')
const zip = require('cross-zip')
const pkg = require('../package.json')
const appcast = require('../appcast.json')
const info = require('../kuroshiro.bobplugin/info.json')

const tmp = tempy.file({ name: 'kuroshiro.bobplugin.zip' })

const version = pkg.version
const versionInc = ['patch', 'minor', 'major'].map(
    (c) => `${c}(${semver.inc(version, c)})`,
)

function resolve(str) {
    return path.resolve(__dirname, str)
}

async function run() {
    let targetVersion = null

    const { tag } = await prompt({
        type: 'select',
        name: 'tag',
        message: 'select tag version',
        choices: versionInc.concat('custom'),
    })
    console.log(tag)
    if (tag === 'custom') {
        const { release } = await prompt({
            type: 'input',
            name: 'release',
            message: 'please input your release version!',
            initial: version,
        })
        targetVersion = release
    } else {
        targetVersion = tag.match(/\((.*)\)/)[1]
    }
    // 判断目标版本是否符合 semver
    if (!semver.valid(targetVersion)) {
        throw new Error(`invalid target version: ${targetVersion}`)
    }
    // 二次确认
    const { confirm } = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: `Sure to release this version: ${targetVersion}`,
    })

    if (!confirm) {
        return
    }

    // get sha256
    zip.zipSync(resolve('../kuroshiro.bobplugin'), tmp)
    const sha256 = createHash('sha256')
        .update(fs.readFileSync(tmp))
        .digest('hex')
    fs.removeSync(tmp)

    // modify package.json & generate new appcast.json
    fs.writeFileSync(resolve('../package.json'), JSON.stringify({
        ...pkg,
        version: targetVersion
    }, null, 4))

    fs.writeFileSync(resolve('../kuroshiro.bobplugin/info.json'), JSON.stringify({
        ...info,
        version: targetVersion
    }, null, 4))


    fs.writeFileSync(resolve('../appcast.json'), JSON.stringify({
        ...appcast,
        versions: [
            {
                version: targetVersion,
                desc: `release: ${targetVersion}`,
                sha256,
                url: '',
                minBobVersion: '0.6.1',
            },
        ].concat(appcast.versions)
    }, null, 4))

    const spinner = ora('push to github...\n').start()

    await execa('git', ['add', '-A'])
    await execa('git', ['commit', '-m', `release: v${targetVersion}`])
    await execa('git', ['tag', `v${targetVersion}`])
    await execa('git', ['push', 'origin', `refs/tags/v${targetVersion}`])
    await execa('git', ['push'])

    spinner.succeed(`release v${targetVersion} success!`)
}
run()
