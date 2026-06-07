import logging
from blackbox.logging_config import configure_logging
from blackbox.logging_filter import SecretRedactionFilter

def test_configure_logging_installs_redaction():
    configure_logging()
    root = logging.getLogger()
    has_filter = any(isinstance(f, SecretRedactionFilter) for f in root.filters) or \
                 any(any(isinstance(f, SecretRedactionFilter) for f in h.filters) for h in root.handlers)
    assert has_filter
