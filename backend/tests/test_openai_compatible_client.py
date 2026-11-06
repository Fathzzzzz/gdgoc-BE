import httpx
import pytest
from fastapi import HTTPException
from pydantic import SecretStr

from app.core.config import get_settings
from app.modules.recommendations.client import AIRecommendationClient


@pytest.fixture
def provider_settings(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "ai_base_url", "https://provider.example/api/v1/")
    monkeypatch.setattr(settings, "ai_api_key", SecretStr("test-provider-key"))
    monkeypatch.setattr(settings, "ai_model", "provider/movie-model")
    return settings


@pytest.mark.parametrize("suffix", ["", "chat/completions"])
def test_openai_compatible_endpoint(client, provider_settings, monkeypatch, suffix):
    monkeypatch.setattr(provider_settings, "ai_base_url", provider_settings.ai_base_url + suffix)
    original_post = httpx.Client.post

    def post(self, url, **kwargs):
        if not isinstance(url, httpx.URL) or url.host != "provider.example":
            return original_post(self, url, **kwargs)
        assert str(url) == "https://provider.example/api/v1/chat/completions"
        assert kwargs["headers"] == {"Authorization": "Bearer test-provider-key"}
        body = kwargs["json"]
        assert body["model"] == "provider/movie-model"
        assert body["stream"] is False
        assert body["messages"][0]["role"] == "system"
        assert "Inception" in body["messages"][0]["content"]
        assert body["messages"][1] == {"role": "user", "content": "Film misteri"}
        assert "response_format" not in body
        return httpx.Response(200, json={"choices": [{"message": {
            "content": '```json\n{"movie_id": 1, "reasoning": "Cocok untuk film misteri."}\n```',
        }}]})

    monkeypatch.setattr(httpx.Client, "post", post)
    result = client.post("/api/movies/recommend", json={"prompt": "Film misteri"})
    assert result.status_code == 200
    assert result.json() == {"movie_id": 1, "reasoning": "Cocok untuk film misteri."}


@pytest.mark.parametrize("upstream, code", [
    (401, "RECOMMENDATION_PROVIDER_AUTH"),
    (404, "RECOMMENDATION_PROVIDER_CONFIG"),
    (429, "RECOMMENDATION_PROVIDER_BUSY"),
    (503, "RECOMMENDATION_PROVIDER_BUSY"),
])
def test_openai_error_hides_provider_body(provider_settings, monkeypatch, upstream, code):
    def post(self, url, **kwargs):
        return httpx.Response(upstream, text="private provider diagnostics")

    monkeypatch.setattr(httpx.Client, "post", post)
    with pytest.raises(HTTPException) as exc:
        AIRecommendationClient().generate([], "misteri")
    assert exc.value.status_code == 503
    assert exc.value.detail["code"] == code
    assert "private provider diagnostics" not in str(exc.value.detail)


@pytest.mark.parametrize("failure, status, expected_calls", [
    (httpx.ConnectTimeout, 200, 2),
    (httpx.ReadTimeout, 504, 1),
])
def test_openai_retry_only_before_request(provider_settings, monkeypatch, failure, status, expected_calls):
    calls = 0

    def post(self, url, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise failure("timeout")
        return httpx.Response(200, json={"choices": [{"message": {
            "content": '{"movie_id": 1, "reasoning": "Cocok"}',
        }}]})

    monkeypatch.setattr(httpx.Client, "post", post)
    if status == 200:
        assert AIRecommendationClient().generate([], "misteri")["movie_id"] == 1
    else:
        with pytest.raises(HTTPException) as exc:
            AIRecommendationClient().generate([], "misteri")
        assert exc.value.status_code == status
    assert calls == expected_calls


def test_openai_missing_text(provider_settings, monkeypatch):
    def post(self, url, **kwargs):
        return httpx.Response(200, json={"choices": [{"message": {"content": None}}]})

    monkeypatch.setattr(httpx.Client, "post", post)
    with pytest.raises(HTTPException) as exc:
        AIRecommendationClient().generate([], "misteri")
    assert exc.value.status_code == 502
    assert exc.value.detail["code"] == "RECOMMENDATION_INVALID_OUTPUT"
