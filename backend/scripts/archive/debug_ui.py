import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        errors = []
        page.on('pageerror', lambda exc: errors.append(str(exc)))
        
        def handle_console(msg):
            if msg.type == 'error':
                errors.append(f"CONSOLE ERROR: {msg.text}")
        page.on('console', handle_console)
        
        print("Navigating to app...")
        await page.goto('http://localhost:3001')
        await page.wait_for_timeout(2000)
        
        print("Clicking Korridor-Analyse...")
        await page.click('text=Korridor-Analyse')
        await page.wait_for_timeout(2000)
        
        print("Opening Ziel-Haltestelle dropdown...")
        await page.click('text=Ziel-Haltestelle...')
        await page.wait_for_timeout(1000)
        
        print("Typing KKAN...")
        await page.fill('input[placeholder="Suchen..."]', 'KKAN')
        await page.wait_for_timeout(1000)
        
        print("Selecting Luzern, Kantonalbank...")
        try:
            await page.click('text=Luzern, Kantonalbank')
        except:
            print("Could not click Luzern, Kantonalbank. Is it visible?")
            
        await page.wait_for_timeout(3000)
        
        if errors:
            print("\n!!! ERRORS DETECTED !!!")
            for e in errors:
                print(e)
        else:
            print("\nNo errors detected.")
            
        await browser.close()

asyncio.run(run())
