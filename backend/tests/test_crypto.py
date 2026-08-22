"""Tests de cifrado de secretos (utils/crypto.py)."""

import pytest
from cryptography.fernet import Fernet

from app.config import settings
from app.utils.crypto import CryptoConfigError, decrypt_secret, encrypt_secret


def test_round_trip(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())

    token = encrypt_secret("s3cr3t-getnet-client-secret")
    assert token != "s3cr3t-getnet-client-secret"

    assert decrypt_secret(token) == "s3cr3t-getnet-client-secret"


def test_decrypt_garbage_raises(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())

    with pytest.raises(CryptoConfigError):
        decrypt_secret("not-a-real-fernet-token")


def test_decrypt_with_wrong_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())
    token = encrypt_secret("algo")

    monkeypatch.setattr(settings, "integrations_encryption_key", Fernet.generate_key().decode())
    with pytest.raises(CryptoConfigError):
        decrypt_secret(token)


def test_missing_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "integrations_encryption_key", "")

    with pytest.raises(CryptoConfigError):
        encrypt_secret("algo")
