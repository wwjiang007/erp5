SELECT
  TABLE_NAME, COLUMN_NAME
FROM
  information_schema.COLUMNS
WHERE
  TABLE_SCHEMA=DATABASE()