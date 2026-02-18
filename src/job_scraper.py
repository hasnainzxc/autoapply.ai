import json
import asyncio
from typing import Optional
from dataclasses import dataclass, asdict
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

from logger import SleekLogger


@dataclass
class JobData:
    url: str
    title: str
    company: str
    description: str
    apply_button_selector: Optional[str] = None
    raw_html: Optional[str] = None
    metadata: Optional[dict] = None


class JobScraper:
    DEFAULT_APPLY_SELECTORS = [
        "button[data-testid='apply-button']",
        "button[class*='apply']",
        "a[class*='apply']",
        "[aria-label*='Apply']",
        "button:has-text('Apply')",
        "a:has-text('Apply')",
        "button:has-text('Apply Now')",
        "a:has-text('Apply Now')",
    ]
    
    def __init__(self, config: dict):
        self.config = config
        self.scraper_config = config.get("scraper", {})
        self.logger = SleekLogger("JobScraper")
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def __aenter__(self):
        await self._init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self._cleanup()
    
    async def _init_browser(self):
        self.logger.step("Initializing Playwright browser...")
        playwright = await async_playwright().start()
        
        browser_type = getattr(playwright, self.scraper_config.get("browser_type", "chromium"))
        self.browser = await browser_type.launch(
            headless=self.scraper_config.get("headless", True)
        )
        
        context = await self.browser.new_context(
            user_agent=self.scraper_config.get("user_agent", 
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        )
        self.page = await context.new_page()
        
        self.page.set_default_timeout(
            self.scraper_config.get("navigation_timeout", 30000)
        )
        
        self.logger.success("Browser initialized successfully")
    
    async def _cleanup(self):
        if self.browser:
            await self.browser.close()
            self.logger.info("Browser closed")
    
    async def scrape(self, url: str) -> dict:
        self.logger.step(f"Navigating to: {url}")
        self.logger.thinking(f"Fetching job page content...")
        
        try:
            await self.page.goto(url, wait_until="domcontentloaded")
            self.logger.action(f"Page loaded: {self.page.title}")
            
            title = await self._extract_title()
            self.logger.thinking(f"Extracted title: {title}")
            
            description = await self._extract_description()
            self.logger.thinking(f"Extracted description ({len(description)} chars)")
            
            company = await self._extract_company()
            self.logger.thinking(f"Extracted company: {company}")
            
            apply_selector = await self._find_apply_button()
            if apply_selector:
                self.logger.success(f"Found Apply button: {apply_selector}")
            else:
                self.logger.warning("No Apply button found")
            
            job_data = JobData(
                url=url,
                title=title,
                company=company or "Unknown",
                description=description,
                apply_button_selector=apply_selector,
                metadata={
                    "scraped_at": asyncio.get_event_loop().time(),
                    "page_title": await self.page.title(),
                }
            )
            
            result = self._to_json(job_data)
            self.logger.success("Job data extracted successfully")
            
            return result
            
        except PlaywrightTimeout:
            self.logger.error(f"Timeout while scraping: {url}")
            raise
        except Exception as e:
            self.logger.error(f"Scraping failed: {str(e)}")
            raise
    
    async def _extract_title(self) -> str:
        selectors = [
            "h1",
            "h1[class*='title']",
            "[data-testid='job-title']",
            ".job-title",
            "h1.job-header",
        ]
        
        for selector in selectors:
            try:
                element = await self.page.wait_for_selector(selector, timeout=5000)
                text = await element.inner_text()
                if text:
                    return text.strip()
            except:
                continue
        
        return await self.page.title()
    
    async def _extract_company(self) -> Optional[str]:
        selectors = [
            "[data-testid='company-name']",
            ".company-name",
            "[class*='company']",
            "a[class*='company']",
        ]
        
        for selector in selectors:
            try:
                element = await self.page.wait_for_selector(selector, timeout=3000)
                text = await element.inner_text()
                if text:
                    return text.strip()
            except:
                continue
        
        return None
    
    async def _extract_description(self) -> str:
        selectors = [
            "[data-testid='job-description']",
            ".job-description",
            "#job-description",
            "[class*='description']",
            "[class*='details']",
        ]
        
        for selector in selectors:
            try:
                element = await self.page.wait_for_selector(selector, timeout=5000)
                text = await element.inner_text()
                if text and len(text) > 100:
                    return text.strip()
            except:
                continue
        
        self.logger.warning("Could not find main description, falling back to page content")
        return await self.page.content()
    
    async def _find_apply_button(self) -> Optional[str]:
        custom_selectors = self.scraper_config.get("apply_button_selectors", [])
        selectors_to_try = self.DEFAULT_APPLY_SELECTORS + custom_selectors
        
        for selector in selectors_to_try:
            try:
                element = await self.page.wait_for_selector(selector, timeout=2000)
                if element:
                    return selector
            except:
                continue
        
        return None
    
    def _to_json(self, job_data: JobData) -> dict:
        return asdict(job_data)
    
    async def scrape_multiple(self, urls: list) -> list:
        results = []
        
        for url in urls:
            self.logger.step(f"Scraping {len(results) + 1}/{len(urls)}: {url}")
            try:
                result = await self.scrape(url)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Failed to scrape {url}: {e}")
                results.append({"url": url, "error": str(e)})
            
            await asyncio.sleep(1)
        
        return results


async def main():
    import yaml
    
    with open("config/config.yaml", "r") as f:
        config = yaml.safe_load(f)
    
    async with JobScraper(config) as scraper:
        test_url = "https://jobs.lever.co/example"
        
        result = await scraper.scrape(test_url)
        
        print("\n" + "="*60)
        print("JSON OUTPUT FOR RESUME CRAFTING:")
        print("="*60)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
