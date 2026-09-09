UPDATE "invoices"
SET "status" = 'PENDING',
    "r2_object_key" = NULL,
    "file_name" = NULL,
    "mime_type" = NULL,
    "file_size" = NULL,
    "generated_at" = NULL,
    "updated_at" = now()
WHERE "status" = 'GENERATED';
