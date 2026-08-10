# Quant engine conventions

The engine currently implements the standard normal PDF/CDF; Black-Scholes with analytical Greeks; Black-76; Garman-Kohlhagen; continuous discount, zero and forward rates; linear interpolation; a simplified zero-quote bootstrap; deterministic synthetic volatility surfaces; and seeded geometric Brownian motion.

Rates and volatilities are decimals. Time is years. Vega is per one volatility point, theta per calendar day and rho per 100bp. Curves use continuous compounding. The bootstrap is educational: a production implementation must convert deposits, futures, OIS and swaps to dated cashflows and solve the relevant multi-curve system.
