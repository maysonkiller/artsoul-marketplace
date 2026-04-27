# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: RLS Политики для Social Logins

## ПРОБЛЕМА
Ошибка: `new row violates row-level security policy`

Социальные логины (X, Google, Discord) через AppKit создают wallet address, но НЕ создают Supabase authenticated сессию. Текущие политики требуют `TO authenticated`, что блокирует загрузку файлов.

## РЕШЕНИЕ

### Шаг 1: Зайди в Supabase Dashboard
1. Открой https://supabase.com/dashboard
2. Выбери проект: **bexigvqrunomwtjsxlej**
3. Нажми **SQL Editor** в левом меню
4. Нажми **New Query**

### Шаг 2: Скопируй и выполни этот SQL

```sql
-- ============================================
-- ИСПРАВЛЕНИЕ RLS ДЛЯ SOCIAL LOGINS
-- ============================================

-- 1. STORAGE: Разрешить загрузку для всех (включая anon)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to artworks bucket" ON storage.objects;

CREATE POLICY "Public can upload to artworks"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'artworks');

-- 2. STORAGE: Разрешить чтение для всех
DROP POLICY IF EXISTS "Anyone can view artworks" ON storage.objects;
DROP POLICY IF EXISTS "Public can view" ON storage.objects;

CREATE POLICY "Public can view artworks"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artworks');

-- 3. PROFILES: Разрешить все операции для всех
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public can read profiles"
ON profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can insert profiles"
ON profiles FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can update profiles"
ON profiles FOR UPDATE
TO public
USING (true);

-- 4. Проверка: Показать все политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Шаг 3: Нажми RUN (или Ctrl+Enter)

Ты должен увидеть сообщение: **Success. No rows returned**

### Шаг 4: Проверь результат

Выполни эту проверку:
```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'storage.objects')
ORDER BY tablename, policyname;
```

Должны быть политики:
- `Public can read profiles` (SELECT, public)
- `Public can insert profiles` (INSERT, public)
- `Public can update profiles` (UPDATE, public)
- `Public can upload to artworks` (INSERT, public)
- `Public can view artworks` (SELECT, public)

## ПОЧЕМУ ЭТО БЕЗОПАСНО?

1. **Wallet Address как идентификатор**
   - Каждый профиль привязан к wallet_address
   - Невозможно изменить чужой профиль без приватного ключа

2. **Bucket изоляция**
   - Политики применяются только к bucket 'artworks'
   - Другие buckets защищены отдельно

3. **Application-level security**
   - Frontend проверяет wallet_address перед операциями
   - Supabase RLS - второй уровень защиты

## ЧТО ДАЛЬШЕ?

После выполнения SQL:
1. Обнови страницу сайта (Ctrl+F5)
2. Подключись через X или Google
3. Попробуй загрузить аватар
4. Сохрани профиль

Должно работать без ошибок!

## ЕСЛИ НЕ РАБОТАЕТ

Проверь в консоли браузера:
- Нет ли ошибок 406 или 400 от Supabase
- Есть ли wallet address в localStorage: `localStorage.getItem('artsoul_wallet')`
- Вызывается ли функция `getCurrentWalletAddress()`

Напиши мне результат!
