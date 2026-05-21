-- Create admin user in new Supabase
-- Uses pgcrypto for password hashing (bcrypt)
DO $$
DECLARE
  v_uid uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_uid FROM auth.users WHERE email = 'sacredhealingvibe@gmail.com';
  
  IF v_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sacredhealingvibe@gmail.com',
      crypt('SiddhaQuantum2050!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Kritagya Das"}',
      NOW(), NOW(), '', '', '', ''
    )
    RETURNING id INTO v_uid;
    RAISE NOTICE 'Created admin user: %', v_uid;
  ELSE
    -- Update password if user exists
    UPDATE auth.users 
    SET encrypted_password = crypt('SiddhaQuantum2050!', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_uid;
    RAISE NOTICE 'Updated existing user: %', v_uid;
  END IF;
END $$;

-- Also create for Laila
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'laila.amrouche@gmail.com';
  
  IF v_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'laila.amrouche@gmail.com',
      crypt('SiddhaQuantum2050!', gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    );
    RAISE NOTICE 'Created Laila user';
  ELSE
    UPDATE auth.users 
    SET encrypted_password = crypt('SiddhaQuantum2050!', gen_salt('bf')),
        email_confirmed_at = NOW(), updated_at = NOW()
    WHERE id = v_uid;
    RAISE NOTICE 'Updated Laila user: %', v_uid;
  END IF;
END $$;
