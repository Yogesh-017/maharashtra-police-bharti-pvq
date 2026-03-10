const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // Check if puppeteer is installed correctly
    console.log("Starting Puppeteer test script...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // 1. Desktop View
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    await page.screenshot({ path: 'desktop_landing.png' });
    console.log("Saved desktop_landing.png");

    // Login
    await page.waitForSelector('#auth-email', { timeout: 5000 }).catch(() => console.log('Auth email not found, might already be logged in'));
    if (await page.$('#auth-email')) {
        await page.type('#auth-email', 'test@example.com');
        await page.type('#auth-password', 'password');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('#auth-submit')
        ]);
        console.log("Logged in");
    }

    // Exam Type -> District -> Year
    await page.goto('http://localhost:3000/#examtype-screen', { waitUntil: 'networkidle0' });
    await page.evaluate(() => { App.showScreen('district-screen'); });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
        App.state.examType = 'police_bharti';
        App.state.district = 'jalna';
        App.showScreen('year-screen');
    });
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
        App.state.year = 2018;
        App.showScreen('section-screen');
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Select Reasoning section
    await page.evaluate(() => {
        App.state.selectedSections = ['reasoning'];
        App.startQuiz();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Screenshot Desktop Quiz
    await page.screenshot({ path: 'desktop_quiz.png' });
    console.log("Saved desktop_quiz.png");

    // 2. Mobile View
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await page.reload({ waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
        App.state.selectedSections = ['reasoning'];
        App.startQuiz();
    });
    await new Promise(r => setTimeout(r, 1000));
    // Screenshot Mobile Quiz
    await page.screenshot({ path: 'mobile_quiz.png' });
    console.log("Saved mobile_quiz.png");

    // Submit Quiz & Show Results / Donation Modal
    await page.evaluate(() => { App.submitQuiz(); });
    await new Promise(r => setTimeout(r, 2000)); 
    
    await page.screenshot({ path: 'mobile_results.png' });
    console.log("Saved mobile_results.png");

    await browser.close();
    console.log("All screenshots captured successfully.");
})();
