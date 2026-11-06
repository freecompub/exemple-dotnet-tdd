<!-- markdownlint-disable-file -->
# Pull request prose

## Summary

Apply the best eligible quantity-tier discount per line

## What changes

Apply shared quantity tiers independently to each basket line, using only the highest eligible rate without combining lines or stacking tiers. Add validated discount-rate and tier values, calculate discounts and net payable amounts in the domain, and extend `Panier`, `LigneDePanier`, and `CalculDuPanier` while keeping the existing no-tier call available.

## Why

Customers buying more of the same reference need the automatic discount described by US-2. ADR-003 classifies basket pricing as a pure Query over the supplied basket and tiers, returning a `Facture` without mutation or events; ADR-001 keeps commercial rules in the domain.

## Out of scope and limitations

The query does not persist a sale, reserve or freeze tiers for a later order, or retain pricing history (ADR-003). It introduces no new rounding rule.
