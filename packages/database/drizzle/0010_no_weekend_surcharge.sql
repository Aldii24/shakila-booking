UPDATE bundle_packages
SET weekend_surcharge = 0,
    conditions = conditions - 'Tambahan akhir pekan atau hari libur Rp50.000 per paket',
    updated_at = now()
WHERE weekend_surcharge <> 0
   OR conditions ? 'Tambahan akhir pekan atau hari libur Rp50.000 per paket';
