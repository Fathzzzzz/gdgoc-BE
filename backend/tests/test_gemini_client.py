import httpx
import pytest
from fastapi import HTTPException
from app.core.config import get_settings
from app.modules.recommendations.client import GeminiClient

@pytest.mark.parametrize("mode,status", [("timeout",504),("network",503),("quota",503),("bad_json",502),("missing",502),("valid",200)])
def test_provider_boundary(monkeypatch, mode, status):
    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-only-key")
    def post(self, url, **kwargs):
        assert kwargs["headers"]["x-goog-api-key"] == "test-only-key"
        assert kwargs["json"]["generationConfig"]["responseMimeType"] == "application/json"
        assert "Catalog:" in kwargs["json"]["systemInstruction"]["parts"][0]["text"]
        if mode == "timeout": raise httpx.ReadTimeout("timeout")
        if mode == "network": raise httpx.ConnectError("offline")
        if mode == "quota": return httpx.Response(429)
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
