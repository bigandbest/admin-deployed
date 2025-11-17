-- Helper functions for wallet system
-- This file should be run in Supabase SQL editor after the main migration

-- Function to get wallet statistics for a user
CREATE OR REPLACE FUNCTION get_wallet_stats(wallet_user_id uuid)
RETURNS TABLE (
  total_topups numeric,
  total_spent numeric,
  total_refunds numeric,
  total_credits numeric,
  total_debits numeric,
  transaction_count bigint
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'TOPUP' THEN amount ELSE 0 END), 0) as total_topups,
    COALESCE(SUM(CASE WHEN transaction_type = 'SPEND' THEN amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN transaction_type = 'REFUND' THEN amount ELSE 0 END), 0) as total_refunds,
    COALESCE(SUM(CASE WHEN transaction_type = 'ADMIN_CREDIT' THEN amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN transaction_type = 'ADMIN_DEBIT' THEN amount ELSE 0 END), 0) as total_debits,
    COUNT(*)::bigint as transaction_count
  FROM wallet_transactions 
  WHERE user_id = wallet_user_id 
    AND status = 'COMPLETED';
END;
$$;

-- Function to get admin wallet overview
CREATE OR REPLACE FUNCTION get_admin_wallet_overview()
RETURNS TABLE (
  total_wallets bigint,
  active_wallets bigint,
  frozen_wallets bigint,
  total_balance numeric,
  total_transactions bigint,
  total_volume numeric,
  avg_wallet_balance numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM wallets)::bigint as total_wallets,
    (SELECT COUNT(*) FROM wallets WHERE is_frozen = false)::bigint as active_wallets,
    (SELECT COUNT(*) FROM wallets WHERE is_frozen = true)::bigint as frozen_wallets,
    (SELECT COALESCE(SUM(balance), 0) FROM wallets) as total_balance,
    (SELECT COUNT(*) FROM wallet_transactions WHERE status = 'COMPLETED')::bigint as total_transactions,
    (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE status = 'COMPLETED') as total_volume,
    (SELECT COALESCE(AVG(balance), 0) FROM wallets) as avg_wallet_balance;
END;
$$;

-- Function to clean up expired topup orders
CREATE OR REPLACE FUNCTION cleanup_expired_topups()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE wallet_topups_pending 
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'PENDING' 
    AND expires_at < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

-- Function to get wallet balance safely (with locking)
CREATE OR REPLACE FUNCTION get_wallet_balance_for_update(wallet_user_id uuid)
RETURNS TABLE (
  wallet_id uuid,
  current_balance numeric,
  is_frozen boolean,
  version integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.balance, w.is_frozen, w.version
  FROM wallets w 
  WHERE w.user_id = wallet_user_id
  FOR UPDATE;
END;
$$;

-- Create a scheduled job to clean up expired topups (if pg_cron is available)
-- This would need to be run manually in Supabase if pg_cron is not available
-- SELECT cron.schedule('cleanup-expired-topups', '*/15 * * * *', 'SELECT cleanup_expired_topups();');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_wallet_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_wallet_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_topups() TO authenticated;
GRANT EXECUTE ON FUNCTION get_wallet_balance_for_update(uuid) TO authenticated;