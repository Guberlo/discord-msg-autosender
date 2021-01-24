const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require("fs");
const inquirer = require("inquirer");
const chalk = require("chalk");
const error = chalk.bold.red;
const warning = chalk.bold.keyword('orange');

const log = console.log;

const {
    discord_password,
    discord_user,
    server_name
} = require('./config');

const port = 1337;
const DISCORD_APP_URL = "https://discordapp.com/app";
const MEME_API = "https://some-random-api.ml/meme"; // Not being used for now
//const RANDOM_WORDAPI_KEY = 'NW8TVMH0'; // not being used for now


axios.interceptors.request.use(function (config) {

    config.metadata = {
        startTime: new Date()
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

axios.interceptors.response.use(function (response) {

    response.config.metadata.endTime = new Date()
    response.duration = response.config.metadata.endTime - response.config.metadata.startTime
    return response;
}, function (error) {
    error.config.metadata.endTime = new Date();
    error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
    return Promise.reject(error);
});



(async () => {
    const response = await axios.get(`http://localhost:${port}/json/version`);

    if (response.status !== 200) {
        log(error(`[!] CHECK IF YOUR CHROME/CHROMIUM IS REALLY LISTENING ON PORT ${port}`));
    } else {
        log(chalk.bold.green(`[+] Got Response from http://localhost:${port}/json/version`));
    }

    const {
        webSocketDebuggerUrl
    } = response.data;
    log(chalk.blue(`[?] Got webSocketDebuggerUrl: ${webSocketDebuggerUrl}`));

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null
    });
    log(chalk.bold.green(`[+] Connected to chrome instance`));
    const page = await browser.newPage();
    await page.setViewport({
        width: 1300,
        height: 1100
    });
    await page.goto(DISCORD_APP_URL);

    if (page.url() === "https://discord.com/login") {
        log(chalk.blue(`[INFO] Got redirect to https://discord.com/login`));
        log(chalk.bold.blue(`[+] Attempting login with given credentials`));
        await page.waitForSelector('[name="email"]');
        await page.evaluate(() => document.querySelector('[name="email"]').value = "");
        await page.focus('[name="email"]');
        await page.keyboard.type(discord_user.toString(), {
            delay: 100
        });
        await page.waitForSelector('[type="password"]');
        await page.evaluate(() => document.querySelector('[type="password"]').value = "");
        await page.focus('[type="password"]')
        await page.keyboard.type(discord_password.toString(), {
            delay: 100
        });
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation()
        ]);
        log(page.url());
        if (page.url() !== "https://discord.com/login") {
            log(chalk.bold.green(`[+] Login Successfull!`));
        } else {
            log(error(`[!] Login failed, Exiting now...!`));
            // eslint-disable-next-line no-undef
            process.exit(1);
        }
    }



    await page.waitForSelector(`[aria-label=" ${server_name}"]`);
    await page.evaluate(({
        server_name
    }) => document.querySelector(`[aria-label=" ${server_name}"]`).click(), {
        server_name
    });
    await autoScroll(page);

    await page.waitFor(() => document.querySelectorAll('.containerDefault--pIXnN').length);

    const channels__ = await page.evaluate(() => {
        let channels = document.querySelectorAll('.name-23GUGE');
        let chans = Array();
        for (let i = 0; i < channels.length; i++) {
            if (!channels[i].previousSibling.hasAttribute('name')) {
                chans.push(channels[i].innerHTML);
            }
        }
        return chans;
    });

    await page.setViewport({
        width: 1300,
        height: 768
    });

    let flood__channel_ = "";

    await inquirer
        .prompt([{
            type: 'checkbox',
            name: 'channel',
            message: 'Which channel you want to flood? (only first choice will be considerated)',
            choices: channels__,
            default: "general",
        }, ])
        .then(answers => {
            flood__channel_ = answers.channel[0];
        });

    log(chalk.bold.white('[+] Selected channel: ' + chalk.bold.red(`${flood__channel_}`)));

    await page.evaluate(({
        flood__channel_
    }) => {
        let channels = document.querySelectorAll('.name-23GUGE');
        for (let i = 0; i < channels.length; i++) {
            if (channels[i].innerHTML == flood__channel_) {
                channels[i].click();
            }
        }
    }, {
        flood__channel_
    });


    await page.waitForSelector('[class="markup-2BOw-j slateTextArea-1Mkdgw fontSize16Padding-3Wk7zP"]');
    await page.focus('[class="markup-2BOw-j slateTextArea-1Mkdgw fontSize16Padding-3Wk7zP"]');

    log(warning(`[+] Starting channel flood.`));
    try {
        let n_work = 1;
        let n_tip = 1;
        const work = ['t!w', 't!work'];
        const tip = ['t!tips', 't!tip'];

        let random = Math.floor(Math.random() * 1000 + 5);
        
        // Send work
        setInterval(async() => {
            random = Math.floor(Math.random() * 2);
            await page.keyboard.type(work[random], {
                delay: 50
            });
            await page.keyboard.press('Enter');
            log(`[+] Farmed ${n_work} times t!work to channel ${flood__channel_}`);
            n_work++;
            random = Math.floor(Math.random() * 1000 + 5);
        }, 32000 + random);

        // Send tip
        setInterval(async() => {
            random = Math.floor(Math.random() * 2);
            await page.keyboard.type(tip[random], {
                delay: 50
            });
            await page.keyboard.press('Enter');
            log(`[+] Farmed ${n_tip} times t!tips to channel ${flood__channel_}`);
            n_tip++;
            random = Math.floor(Math.random() * 1000 + 5);
        }, 15000 + random);

    } catch (err) {
        log(error(err.toString()));
    }
})();

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        // eslint-disable-next-line no-unused-vars
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 1000;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}