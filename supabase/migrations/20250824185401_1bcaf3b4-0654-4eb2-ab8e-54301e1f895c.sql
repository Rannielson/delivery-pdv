-- Fix orders with NULL company_id by setting to the owner's company
UPDATE orders 
SET company_id = (
  SELECT p.company_id 
  FROM profiles p 
  WHERE p.id = (
    SELECT c.owner_id 
    FROM companies c 
    WHERE c.owner_id IS NOT NULL 
    LIMIT 1
  )
  LIMIT 1
)
WHERE company_id IS NULL;