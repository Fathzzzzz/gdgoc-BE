import httpx
import pytest
from fastapi import HTTPException
from app.core.config import get_settings
from app.modules.recommendations.client import GeminiClient

@pytest.mark.parametrize("mode,status", [("timeout",504),("network",503),("quota",503),("busy",503),("bad_json",502),("missing",502),("valid",200),("connect_retry",200)])
def test_provider_boundary(monkeypatch, mode, status):
    settings = get_settings()
    monkeypatch.setattr(settings, "gemini_api_key", "test-only-key")
    model = "gemini-3.8-flash" if status == 200 else "gemini-2.5-flash"
    monkeypatch.setattr(settings, "gemini_model", model)
    attempts = 0
    def post(self, url, **kwargs):
        nonlocal attempts
        attempts += 1
        assert kwargs["headers"]["x-goog-api-key"] == "test-only-key"
        assert url.endswith(f"/{model}:generateContent")
        config = kwargs["json"]["generationConfig"]
        assert config["responseMimeType"] == "application/json"
        assert "temperature" not in config
        if status == 200:
            assert config["thinkingConfig"] == {"thinkingLevel": "LOW"}
        else:
            assert "thinkingConfig" not in config
        assert "Catalog:" in kwargs["json"]["systemInstruction"]["parts"][0]["text"]
        if mode == "timeout": raise httpx.ReadTimeout("timeout")
        if mode == "network": raise httpx.ConnectError("offline")
        if mode == "connect_retry" and attempts == 1:
            raise httpx.ConnectTimeout("TLS handshake timed out")
        if mode == "quota": return httpx.Response(429)
        if mode == "busy": return httpx.Response(503)
        if mode == "bad_json": return httpx.Response(200, text="bad")
        if mode == "missing": return httpx.Response(200, json={})
        return httpx.Response(200, json={"candidates":[{"content":{"parts":[{"text":'{"movie_id":1,"reasoning":"Cocok"}'}]}}]})
    monkeypatch.setattr(httpx.Client, "post", post)
    if status == 200:
        assert GeminiClient().generate([{"id":1}], "sci-fi")["movie_id"] == 1
    else:
        with pytest.raises(HTTPException) as err:
            GeminiClient().generate([{"id":1}], "sci-fi")
        assert err.value.status_code == status
        if mode == "busy":
            assert err.value.detail["code"] == "GEMINI_PROVIDER_BUSY"
    assert attempts == {"network": 3, "connect_retry": 2}.get(mode, 1)
