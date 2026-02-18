import os
import yaml
from pathlib import Path
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    _instance: Optional["Config"] = None
    _config: dict = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._config:
            self._load()
    
    def _load(self):
        config_path = Path(__file__).parent.parent / "config" / "config.yaml"
        
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(config_path, "r") as f:
            self._config = yaml.safe_load(f)
        
        self._resolve_env_vars()
    
    def _resolve_env_vars(self):
        def resolve(value):
            if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                env_var = value[2:-1]
                return os.getenv(env_var, "")
            return value
        
        def resolve_dict(d):
            result = {}
            for k, v in d.items():
                result[k] = resolve(v) if not isinstance(v, dict) else resolve_dict(v)
            return result
        
        for key in self._config:
            if isinstance(self._config[key], dict):
                self._config[key] = resolve_dict(self._config[key])
            else:
                self._config[key] = resolve(self._config[key])
    
    def get(self, key: str, default: Any = None) -> Any:
        keys = key.split(".")
        value = self._config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
            
            if value is None:
                return default
        
        return value
    
    @property
    def minimax_api_key(self) -> str:
        return self.get("minimax.api_key", "")
    
    @property
    def minimax_base_url(self) -> str:
        return self.get("minimax.base_url", "https://api.minimax.chat/v1")
    
    @property
    def minimax_model(self) -> str:
        return self.get("minimax.models.primary", "abab6.5-chat")
    
    @property
    def temperature_cover_letter(self) -> float:
        return self.get("minimax.temperature.cover_letter", 0.7)
    
    @property
    def temperature_resume(self) -> float:
        return self.get("minimax.temperature.resume", 0.2)


config = Config()
