-- Call the edge function to create your admin user
SELECT extensions.http_post(
  'https://ivjseqqgsohvyjwjfnkh.supabase.co/functions/v1/create-admin-user',
  '{"email": "anewtakegear@gmail.com", "password": "Frogger123"}',
  'application/json'
) as create_user_result;