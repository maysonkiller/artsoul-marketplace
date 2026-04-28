# Инструкция по очистке RLS политик

## Проблема
В Supabase есть дублирующиеся политики (старые + новые), что может вызывать конфликты.

## Решение

### Шаг 1: Выполнить cleanup скрипт

1. Откройте: https://supabase.com/dashboard/project/bexigvqrunomwtjsxlej/sql/new
2. Скопируйте **весь код** из файла `supabase-rls-cleanup.sql`
3. Вставьте в SQL Editor
4. Нажмите **RUN**

### Шаг 2: Проверить результат

После выполнения должна появиться таблица с **только 12 политиками** (по 3 на каждую таблицу):

```
profiles:
  - profiles_select_all (SELECT)
  - profiles_insert_authenticated (INSERT)
  - profiles_update_authenticated (UPDATE)

artworks:
  - artworks_select_all (SELECT)
  - artworks_insert_authenticated (INSERT)
  - artworks_update_authenticated (UPDATE)

auctions:
  - auctions_select_all (SELECT)
  - auctions_insert_authenticated (INSERT)
  - auctions_update_authenticated (UPDATE)

bids:
  - bids_select_all (SELECT)
  - bids_insert_authenticated (INSERT)
  - bids_update_authenticated (UPDATE)
```

### Шаг 3: Тестирование

После выполнения cleanup скрипта:

1. Откройте https://maysonkiller.github.io/artsoul-marketplace/
2. Подключите кошелек (без подписи)
3. Перейдите в профиль
4. Измените bio и сохраните
5. Должна запроситься подпись ОДИН раз
6. Профиль должен сохраниться без ошибок

## Что изменилось

**Старые политики (удалены):**
- Сложные проверки JWT claims
- Дублирующиеся правила
- Конфликтующие условия

**Новые политики (простые):**
- Все могут читать (SELECT)
- Только аутентифицированные могут писать (INSERT/UPDATE)
- Проверка владения на уровне приложения

---

**Выполните cleanup скрипт и напишите результат!**
