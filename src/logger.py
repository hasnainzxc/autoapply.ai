import sys
from pathlib import Path
from loguru import logger
from rich.console import Console
from rich.theme import Theme

custom_theme = Theme({
    "info": "cyan",
    "success": "green",
    "warning": "yellow",
    "error": "bold red",
    "step": "magenta",
})

console = Console(theme=custom_theme)

def init_logger(config: dict) -> None:
    log_config = config.get("logging", {})
    
    logger.remove()
    
    logger.add(
        sys.stdout,
        format=log_config.get("format", "{time:HH:mm:ss} | {level:icon} | {message}"),
        level=log_config.get("level", "INFO"),
        colorize=log_config.get("colorize", True),
        show=log_config.get("show_thread", False),
    )
    
    if log_config.get("file", {}).get("enabled", True):
        file_config = log_config["file"]
        log_path = Path(file_config.get("path", "logs/agent.log"))
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.add(
            log_path,
            rotation=file_config.get("rotation", "10 MB"),
            retention=file_config.get("retention", "7 days"),
            level="DEBUG",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
        )

class SleekLogger:
    def __init__(self, name: str = "Agent"):
        self.name = name
        self.console = console
    
    def step(self, message: str) -> None:
        self.console.print(f"[step]▶[/step] [bold]{message}[/bold]")
    
    def info(self, message: str) -> None:
        self.console.print(f"[info]ℹ[/info] {message}")
    
    def success(self, message: str) -> None:
        self.console.print(f"[success]✓[/success] [green]{message}[/green]")
    
    def warning(self, message: str) -> None:
        self.console.print(f"[warning]⚠[/warning] [yellow]{message}[/yellow]")
    
    def error(self, message: str) -> None:
        self.console.print(f"[error]✗[/error] [bold red]{message}[/bold red]")
    
    def thinking(self, thought: str) -> None:
        self.console.print(f"[dim]💭 {thought}[/dim]")
    
    def action(self, action: str) -> None:
        self.console.print(f"[cyan]→ {action}[/cyan]")
