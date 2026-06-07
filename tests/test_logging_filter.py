import logging, io
from blackbox.logging_filter import SecretRedactionFilter

def _logger_capturing():
    buf = io.StringIO()
    logger = logging.getLogger("blackbox.test.redact")
    logger.handlers.clear()
    h = logging.StreamHandler(buf)
    h.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(h)
    logger.addFilter(SecretRedactionFilter())
    logger.setLevel(logging.INFO)
    return logger, buf

def test_redacts_anthropic_key_in_message():
    logger, buf = _logger_capturing()
    logger.info("calling claude with sk-ant-abc123DEF456 now")
    out = buf.getvalue()
    assert "sk-ant-abc123DEF456" not in out and "[REDACTED]" in out

def test_redacts_api_key_in_args():
    logger, buf = _logger_capturing()
    logger.info("key=%s", "bb_live_TOPSECRETzzz")
    out = buf.getvalue()
    assert "bb_live_TOPSECRETzzz" not in out
