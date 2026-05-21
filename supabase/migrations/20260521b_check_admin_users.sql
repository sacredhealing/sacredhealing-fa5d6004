SELECT 
  email, 
  email_confirmed_at IS NOT NULL as confirmed,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email IN ('sacredhealingvibe@gmail.com', 'laila.amrouche@gmail.com')
ORDER BY email;
