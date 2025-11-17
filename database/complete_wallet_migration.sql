-- Complete Wallet System Migration
-- Run this script in Supabase SQL Editor to create all wallet tables and functions
-- Execute this ONCE to set up the entire wallet system

-- 1. Clean up any existing wallet components (safe to run multiple times)
DO $$ 
BEGIN 

    -- Drop triggers safely without requiring table existence
    BEGIN
        DROP TRIGGER IF EXISTS auto_create_wallet ON users;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop auto_create_wallet trigger: %', SQLERRM;
    END;
    
    BEGIN
        DROP TRIGGER IF EXISTS validate_wallet_balance_trigger ON wallets;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop validate_wallet_balance_trigger: %', SQLERRM;
    END;
    
    BEGIN
        DROP TRIGGER IF EXISTS wallet_updated_at_trigger ON wallets;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop wallet_updated_at_trigger: %', SQLERRM;
    END;
    
    -- Drop functions if they exist
    BEGIN
        DROP FUNCTION IF EXISTS create_wallet_for_new_user() CASCADE;
        DROP FUNCTION IF EXISTS validate_wallet_balance() CASCADE;
        DROP FUNCTION IF EXISTS update_wallet_timestamp() CASCADE;
        DROP FUNCTION IF EXISTS get_wallet_stats(uuid) CASCADE;
        DROP FUNCTION IF EXISTS get_admin_wallet_overview() CASCADE;
        DROP FUNCTION IF EXISTS cleanup_expired_topups() CASCADE;
        DROP FUNCTION IF EXISTS get_wallet_balance_for_update(uuid) CASCADE;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Could not drop some functions: %', SQLERRM;
    END;
    
    -- Drop policies if they exist
    BEGIN
        DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can view own transactions" ON wallet_transactions;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Service role can insert transactions" ON wallet_transactions;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Admins can view audit logs" ON wallet_audit_logs;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Users can view own pending topups" ON wallet_topups_pending;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Service role can manage pending topups" ON wallet_topups_pending;
    EXCEPTION WHEN undefined_table THEN NULL;
    WHEN OTHERS THEN NULL;
    END;
    
    -- Drop tables if they exist (in reverse order due to foreign keys)
    DROP TABLE IF EXISTS wallet_audit_logs CASCADE;
    DROP TABLE IF EXISTS wallet_transactions CASCADE;
    DROP TABLE IF EXISTS wallet_topups_pending CASCADE;
    DROP TABLE IF EXISTS wallets CASCADE;
    
    RAISE NOTICE 'Cleaned up existing wallet components successfully';
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Cleanup completed with some issues (this is normal): %', SQLERRM;
END $$;

-- 2. Create wallets table
CREATE TABLE wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance numeric(10,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  is_frozen boolean DEFAULT false,
  frozen_reason text,
  frozen_by uuid,
  frozen_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1,
  
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (frozen_by) REFERENCES users(id),
  UNIQUE(user_id)
);

-- 3. Create wallet_transactions table  
CREATE TABLE wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  transaction_type varchar(50) NOT NULL CHECK (transaction_type IN (
    'TOPUP', 'SPEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'REVERSAL'
  )),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  balance_before numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  reference_type varchar(50), -- 'ORDER', 'TOPUP_ORDER', 'REFUND_REQUEST', 'MANUAL'
  reference_id uuid,
  razorpay_order_id varchar(255),
  razorpay_payment_id varchar(255),
  description text,
  metadata jsonb DEFAULT '{}',
  status varchar(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  idempotency_key varchar(255),
  created_by uuid, -- Admin user for manual transactions
  created_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(idempotency_key)
);

-- 4. Create wallet_audit_logs table for admin actions
CREATE TABLE wallet_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  action varchar(50) NOT NULL CHECK (action IN (
    'FREEZE', 'UNFREEZE', 'MANUAL_CREDIT', 'MANUAL_DEBIT', 'VIEW_DETAILS', 'EXPORT_DATA'
  )),
  amount numeric(10,2),
  reason text,
  previous_balance numeric(10,2),
  new_balance numeric(10,2),
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- 5. Create wallet_topups_pending table for Razorpay order tracking
CREATE TABLE wallet_topups_pending (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  razorpay_order_id varchar(255) NOT NULL UNIQUE,
  status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED')),
  razorpay_payment_id varchar(255),
  razorpay_signature varchar(255),
  payment_method varchar(50),
  failure_reason text,
  expires_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- 6. Create indexes for performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_transactions_idempotency ON wallet_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_wallet_audit_logs_wallet_id ON wallet_audit_logs(wallet_id);
CREATE INDEX idx_wallet_audit_logs_admin_id ON wallet_audit_logs(admin_id);
CREATE INDEX idx_wallet_audit_logs_created_at ON wallet_audit_logs(created_at);
CREATE INDEX idx_wallet_topups_pending_user_id ON wallet_topups_pending(user_id);
CREATE INDEX idx_wallet_topups_pending_status ON wallet_topups_pending(status);
CREATE INDEX idx_wallet_topups_pending_razorpay_order ON wallet_topups_pending(razorpay_order_id);

-- 7. Create the wallet creation function
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create wallet for regular users, not admin users
  IF TG_TABLE_NAME = 'users' THEN
    INSERT INTO wallets (user_id, balance, is_frozen, created_at, updated_at)
    VALUES (NEW.id, 0.00, FALSE, NOW(), NOW());
    
    RAISE NOTICE 'Created wallet for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Wallet already exists, ignore
    RAISE NOTICE 'Wallet already exists for user: %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger for auto wallet creation (with safety check)
DO $$
BEGIN
    -- Check if trigger exists without referencing table structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'auto_create_wallet' 
        AND event_object_table = 'users'
    ) THEN
        CREATE TRIGGER auto_create_wallet
          AFTER INSERT ON users
          FOR EACH ROW
          EXECUTE FUNCTION create_wallet_for_new_user();
        
        RAISE NOTICE 'Created auto_create_wallet trigger successfully';
    ELSE
        RAISE NOTICE 'auto_create_wallet trigger already exists, skipping creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'auto_create_wallet trigger already exists (caught duplicate_object)';
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating auto_create_wallet trigger: %', SQLERRM;
END $$;

-- 9. Create wallet validation function
CREATE OR REPLACE FUNCTION validate_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure balance never goes negative
  IF NEW.balance < 0 THEN
    RAISE EXCEPTION 'Wallet balance cannot be negative. Attempted balance: %', NEW.balance;
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Increment version for optimistic locking
  NEW.version = COALESCE(OLD.version, 0) + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for balance validation (with safety check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'validate_wallet_balance_trigger' 
        AND event_object_table = 'wallets'
    ) THEN
        CREATE TRIGGER validate_wallet_balance_trigger
          BEFORE UPDATE ON wallets
          FOR EACH ROW
          EXECUTE FUNCTION validate_wallet_balance();
        
        RAISE NOTICE 'Created validate_wallet_balance_trigger successfully';
    ELSE
        RAISE NOTICE 'validate_wallet_balance_trigger already exists, skipping creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'validate_wallet_balance_trigger already exists (caught duplicate_object)';
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating validate_wallet_balance_trigger: %', SQLERRM;
END $$;

-- 11. Create function to automatically update wallet updated_at
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for timestamp updates (with safety check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'wallet_updated_at_trigger' 
        AND event_object_table = 'wallets'
    ) THEN
        CREATE TRIGGER wallet_updated_at_trigger
          BEFORE UPDATE ON wallets
          FOR EACH ROW
          EXECUTE FUNCTION update_wallet_timestamp();
        
        RAISE NOTICE 'Created wallet_updated_at_trigger successfully';
    ELSE
        RAISE NOTICE 'wallet_updated_at_trigger already exists, skipping creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'wallet_updated_at_trigger already exists (caught duplicate_object)';
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating wallet_updated_at_trigger: %', SQLERRM;
END $$;

-- 13. Enable Row Level Security
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_topups_pending ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for wallets
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- 15. Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (true);

-- 16. Create RLS policies for wallet_audit_logs
CREATE POLICY "Admins can view audit logs" ON wallet_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 17. Create RLS policies for wallet_topups_pending
CREATE POLICY "Users can view own pending topups" ON wallet_topups_pending
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pending topups" ON wallet_topups_pending
  FOR ALL USING (true);

-- 18. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON wallets TO authenticated;
GRANT SELECT ON wallet_transactions TO authenticated;
GRANT SELECT ON wallet_topups_pending TO authenticated;

-- For service role (backend API)
GRANT ALL ON wallets TO service_role;
GRANT ALL ON wallet_transactions TO service_role;
GRANT ALL ON wallet_audit_logs TO service_role;
GRANT ALL ON wallet_topups_pending TO service_role;

-- 19. Create helper functions for wallet operations
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

-- 20. Grant permissions for helper functions
GRANT EXECUTE ON FUNCTION get_wallet_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_wallet_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_topups() TO authenticated;
GRANT EXECUTE ON FUNCTION get_wallet_balance_for_update(uuid) TO authenticated;

-- 21. Create wallets for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  wallet_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email 
    FROM users u 
    WHERE NOT EXISTS (
      SELECT 1 FROM wallets w WHERE w.user_id = u.id
    )
  LOOP
    BEGIN
      INSERT INTO wallets (user_id, balance, is_frozen, created_at, updated_at)
      VALUES (user_record.id, 0.00, FALSE, NOW(), NOW());
      
      wallet_count := wallet_count + 1;
      RAISE NOTICE 'Created wallet for existing user: % (%)', user_record.email, user_record.id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Wallet already exists for user: % (%)', user_record.email, user_record.id;
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet for user % (%): %', user_record.email, user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created % wallets for existing users', wallet_count;
  RAISE NOTICE 'Wallet system setup completed successfully!';
  RAISE NOTICE 'Tables created: wallets, wallet_transactions, wallet_audit_logs, wallet_topups_pending';
  RAISE NOTICE 'Functions created: wallet creation, validation, statistics, and helper functions';
  RAISE NOTICE 'Triggers created: auto wallet creation, balance validation, timestamp updates';
  RAISE NOTICE 'RLS policies: Enabled with proper user and service role permissions';
END $$;