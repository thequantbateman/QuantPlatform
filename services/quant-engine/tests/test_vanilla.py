import unittest

from app.domain.conventions import OptionType, QuantInputError
from app.models.vanilla import price_black_76, price_black_scholes, price_garman_kohlhagen
from app.pricing.implied_volatility import solve_implied_volatility


class VanillaModelTests(unittest.TestCase):
    def test_black_scholes_reference_and_greeks(self):
        result = price_black_scholes(100, 100, 1, 0.05, 0, 0.2, OptionType.CALL)
        self.assertAlmostEqual(result.pv, 10.45058357, places=7)
        self.assertAlmostEqual(result.delta, 0.63683065, places=7)
        self.assertAlmostEqual(result.gamma, 0.01876202, places=7)
        self.assertAlmostEqual(result.vega, 0.37524035, places=7)
        self.assertAlmostEqual(result.rho, 0.53232482, places=7)

    def test_put_call_parity_with_dividend(self):
        call = price_black_scholes(100, 105, 1.4, 0.03, 0.012, 0.28, OptionType.CALL).pv
        put = price_black_scholes(100, 105, 1.4, 0.03, 0.012, 0.28, OptionType.PUT).pv
        from math import exp
        self.assertAlmostEqual(call - put, 100 * exp(-0.012 * 1.4) - 105 * exp(-0.03 * 1.4), places=10)

    def test_garman_kohlhagen_reference(self):
        result = price_garman_kohlhagen(1.1, 1.1, 1, 0.04, 0.02, 0.15, OptionType.CALL)
        self.assertAlmostEqual(result.pv, 0.0750638674, places=9)
        self.assertIsNotNone(result.foreign_rho)

    def test_black_76_reference(self):
        result = price_black_76(100, 100, 1, 0.05, 0.2, OptionType.CALL)
        self.assertAlmostEqual(result.pv, 7.57708215, places=7)

    def test_implied_volatility_inversion(self):
        target = price_black_scholes(100, 110, 0.75, 0.02, 0.01, 0.31, OptionType.PUT).pv
        result = solve_implied_volatility(target, lambda vol: price_black_scholes(100, 110, 0.75, 0.02, 0.01, vol, OptionType.PUT).pv)
        self.assertTrue(result.converged)
        self.assertAlmostEqual(result.volatility, 0.31, places=10)

    def test_implied_volatility_rejects_impossible_price(self):
        with self.assertRaises(QuantInputError):
            solve_implied_volatility(120, lambda vol: price_black_scholes(100, 100, 1, 0, 0, vol, OptionType.CALL).pv)

    def test_boundaries(self):
        self.assertEqual(price_black_scholes(150, 100, 0, 0, 0, 0.2, OptionType.CALL).pv, 50)
        self.assertAlmostEqual(price_black_scholes(50, 100, 1e-8, 0, 0, 1e-8, OptionType.CALL).pv, 0)
        self.assertGreater(price_black_scholes(150, 100, 1, 0, 0.02, 0.2, OptionType.CALL).pv, 0)


if __name__ == "__main__":
    unittest.main()
