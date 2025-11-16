-- SQL script to remove wallet functionality
-- Run this in your Supabase SQL editor or PostgreSQL client

-- First, drop tables with dependencies
DROP TABLE IF EXISTS wallet_recharge_requests;
DROP TABLE IF EXISTS wallet_refund_requests;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS promotion_wallets;
DROP TABLE IF EXISTS admin_wallet_recharge_requests;
DROP TABLE IF EXISTS admin_wallet_transactions;
DROP TABLE IF EXISTS admin_wallets;
DROP TABLE IF EXISTS user_wallets;
DROP TABLE IF EXISTS wallet_settings;
DROP TABLE IF EXISTS transaction_types;

-- Update refund_requests table to remove 'wallet' from payment_method constraint
-- First, drop the existing constraint
ALTER TABLE refund_requests DROP CONSTRAINT IF EXISTS refund_requests_payment_method_check;

-- Add new constraint without 'wallet'
ALTER TABLE refund_requests ADD CONSTRAINT refund_requests_payment_method_check
CHECK (payment_method::text = ANY (ARRAY['prepaid'::character varying, 'cod'::character varying]::text[]));

-- Note: Check if transaction_types is used elsewhere before dropping
-- If it's only for wallets, it's safe to drop