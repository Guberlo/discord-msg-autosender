const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require("fs");
const inquirer = require("inquirer");
const proxyChain = require('proxy-chain');
const chalk = require("chalk");
const error = chalk.bold.red;
const warning = chalk.bold.keyword('orange');

const log = console.log;

const {
    discord_password,
    discord_user,
    server_name
} = require('./config');

log(chalk.blue(`[INFO] user ${discord_user}, server_name ${server_name}`));

const DISCORD_APP_URL = "https://discordapp.com/app";
const FIVE_MIN = 300000;
const TEN_MIN = FIVE_MIN * 2;
const THIRTY_MIN = TEN_MIN * 3;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const HALF_DAY = DAY_IN_MS / 2;
const flood__channel_ = process.env.CHANNEL_NAME;


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
    const PROXY = await proxyChain.anonymizeProxy(process.env.QUOTAGUARDSTATIC_URL);

    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
            // `--proxy-server=${PROXY}`
        ],
    };

    const browser = await puppeteer.launch(chromeOptions);

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

        workCommand(page);
        tipCommand(page);
        overtimeCommand(page);
        cleanCommand(page);
        dailyCommand(page);

    } catch (err) {
        log(error(err.toString()));
    }
})();

function workCommand(page) {
    const work = ['t!w', 't!work'];
    let n_work = 1;

    let random = Math.floor(Math.random() * 30000 + 1500);
    // Send work every 10 minutes or so
    setInterval(async() => {
        let random_index = Math.floor(Math.random() * 2);
        await page.keyboard.type(work[random_index], {
            delay: 50
        });
        await page.keyboard.press('Enter');
        log(`[+] Farmed ${n_work} times t!work to channel ${flood__channel_}`);
        n_work++;
    }, TEN_MIN + random);
}

function tipCommand(page) {
    let n_tip = 1;
    const tip = ['t!tips', 't!tip'];

    let random = Math.floor(Math.random() * 1500 + 400);
    // Send tip every 5 minutes or so
    setInterval(async() => {
        let random_index = Math.floor(Math.random() * 2);
        await page.keyboard.type(tip[random_index], {
            delay: 50
        });
        await page.keyboard.press('Enter');
        log(`[+] Farmed ${n_tip} times t!tips to channel ${flood__channel_}`);
        n_tip++;
        
    }, FIVE_MIN + random);
}

function overtimeCommand(page) {
    const overtime = ['t!ot', 't!overtime'];
    let n_ot = 1;

    let random = Math.floor(Math.random() * 30000 + 3000);
    // Send work every 10 minutes or so
    setInterval(async() => {
        let random_index = Math.floor(Math.random() * 2);
        await page.keyboard.type(overtime[random_index], {
            delay: 50
        });
        await page.keyboard.press('Enter');
        log(`[+] Farmed ${n_ot} times t!work to channel ${flood__channel_}`);
        n_ot++;
    }, THIRTY_MIN + random);
}

function cleanCommand(page) {
    const clean = "t!clean";
    let n_clean = 1;

    let random = Math.floor(Math.random() * 30000 + 4000);
    // Send work every 10 minutes or so
    setInterval(async() => {
        await page.keyboard.type(clean, {
            delay: 50
        });
        await page.keyboard.press('Enter');
        log(`[+] Farmed ${n_ot} times t!work to channel ${flood__channel_}`);
        n_clean++;
    }, HALF_DAY + random);
}

function dailyCommand(page) {
    const daily = ["t!d", "t!daily"];
    let n_daily = 1;

    let random = Math.floor(Math.random() * 30000 + 10000);
    // Send work every 10 minutes or so
    setInterval(async() => {
        let random_index = Math.floor(Math.random() * 2);
        await page.keyboard.type(daily[random_index], {
            delay: 50
        });
        await page.keyboard.press('Enter');
        log(`[+] Farmed ${n_daily} times t!work to channel ${flood__channel_}`);
        n_daily++;
    }, DAY_IN_MS + random);
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