import asyncio
import argparse
import json
import sys
from pathlib import Path

import yaml
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent))

from src.config import config
from src.logger import init_logger, SleekLogger
from src.job_scraper import JobScraper


def setup_logging():
    init_logger(config._config)
    logger.info("ApplyMate Agentic Environment initialized")


async def scrape_job(url: str, output_file: str = None):
    logger = SleekLogger("Main")
    
    logger.step(f"Starting job scrape: {url}")
    
    async with JobScraper(config._config) as scraper:
        result = await scraper.scrape(url)
        
        if output_file:
            with open(output_file, "w") as f:
                json.dump(result, f, indent=2)
            logger.success(f"Results saved to: {output_file}")
        
        print("\n" + "="*60)
        print("JSON OUTPUT FOR RESUME CRAFTING:")
        print("="*60)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        return result


async def scrape_multiple(urls: list, output_dir: str = "output"):
    logger = SleekLogger("Main")
    Path(output_dir).mkdir(exist_ok=True)
    
    results = []
    
    async with JobScraper(config._config) as scraper:
        for i, url in enumerate(urls):
            logger.step(f"[{i+1}/{len(urls)}] Scraping: {url}")
            
            try:
                result = await scraper.scrape(url)
                results.append(result)
                
                output_file = Path(output_dir) / f"job_{i+1}.json"
                with open(output_file, "w") as f:
                    json.dump(result, f, indent=2)
                    
            except Exception as e:
                logger.error(f"Failed: {url} - {e}")
                results.append({"url": url, "error": str(e)})
    
    logger.success(f"Batch complete: {len([r for r in results if 'error' not in r])}/{len(urls)} successful")
    
    return results


def main():
    parser = argparse.ArgumentParser(description="ApplyMate - Agentic Job Scraper")
    parser.add_argument("url", nargs="?", help="Job URL to scrape")
    parser.add_argument("--batch", "-b", nargs="+", help="Multiple URLs to scrape")
    parser.add_argument("--output", "-o", help="Output JSON file")
    parser.add_argument("--output-dir", "-d", default="output", help="Output directory for batch")
    
    args = parser.parse_args()
    
    setup_logging()
    
    if args.batch:
        asyncio.run(scrape_multiple(args.batch, args.output_dir))
    elif args.url:
        asyncio.run(scrape_job(args.url, args.output))
    else:
        print("Usage: python run.py <job-url>")
        print("       python run.py --batch <url1> <url2> ...")


if __name__ == "__main__":
    main()
