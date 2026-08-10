from enum import Enum


class OptionType(str, Enum):
    CALL = "call"
    PUT = "put"


class Model(str, Enum):
    BSM = "black_scholes_merton"
    GARMAN_KOHLHAGEN = "garman_kohlhagen"
    BLACK_76 = "black_76"


class QuantInputError(ValueError):
    """A finite-domain or arbitrage-bound violation."""
