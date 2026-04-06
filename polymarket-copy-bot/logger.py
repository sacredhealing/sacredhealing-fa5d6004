"""
logger.py — Real-Time Signal Logger
=====================================
Clean, timestamped console output for every bot action.
"""

import logging
import sys
from datetime import datetime


def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger  # Avoid duplicate handlers

    logger.setLevel(logging.DEBUG)

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(name)-10s] %(message)s",
        datefmt="%I:%M:%S %p",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger
