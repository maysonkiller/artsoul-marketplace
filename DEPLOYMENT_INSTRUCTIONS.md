# ИНСТРУКЦИЯ ПО ДЕПЛОЮ AUCTION SYSTEM V2

**Дата:** 2026-04-30  
**Статус:** Смарт-контракты и миграции готовы, требуется деплой

---

## 📋 ЧТО СДЕЛАНО

✅ **Смарт-контракт ArtSoulMarketplaceV2.sol:**
- Новая логика аукционов (floor price, не продажа)
- Депозит 10% на ставки
- 24-часовое окно для покупки победителем
- Прямые продажи после аукциона
- Три роли: Creator, Auction Winner, Current Owner

✅ **SQL миграция supabase-migration-auction-v2.sql:**
- Новые поля в artworks (auction_winner, current_owner, floor_price, sale_price)
- Новые поля в auctions (auction_winner, winner_deadline, winner_purchased)
- Новая таблица bids_history (история ставок с депозитами)
- Helper функции и триггеры

✅ **Deployment скрипт deploy-v2.js:**
- Автоматический деплой NFT + Marketplace V2
- Настройка связей между контрактами
- Верификация параметров

✅ **План переработки AUCTION_REDESIGN_PLAN.md:**
- Детальное описание новой концепции
- Порядок реализации
- Оценка времени

---

## 🚀 СЛЕДУЮЩИЕ ШАГИ

### Шаг 1: Деплой смарт-контрактов

**На Base Sepolia:**
```bash
npx hardhat run scripts/deploy-v2.js --network baseSepolia
```

**На Ethereum Sepolia:**
```bash
npx hardhat run scripts/deploy-v2.js --network sepolia
```

**Результат:**
- Получишь адреса NFT и Marketplace V2 контрактов
- Запиши их для следующего шага

---

### Шаг 2: Запустить SQL миграцию

1. Открой Supabase Dashboard → SQL Editor
2. Скопируй содержимое `supabase-migration-auction-v2.sql`
3. Вставь и нажми Run
4. Проверь что миграция прошла успешно (должно быть сообщение "✅ Migration completed successfully!")

---

### Шаг 3: Обновить frontend (contracts-integration.js)

Замени адреса контрактов на новые:

```javascript
const CONTRACTS = {
    baseSepolia: {
        nft: '0x...', // Новый адрес NFT
        marketplace: '0x...', // Новый адрес Marketplace V2
        chainId: 84532
    },
    sepolia: {
        nft: '0x...', // Новый адрес NFT
        marketplace: '0x...', // Новый адрес Marketplace V2
        chainId: 11155111
    }
};
```

Обнови ABI (добавь новые функции):
- `purchaseByWinner()`
- `setForSale()`
- `purchaseDirectly()`
- `refundAllDeposits()`
- `getAuctionBids()`

---

### Шаг 4: Обновить supabase-client.js

Добавь новые функции для работы с:
- Историей ставок (bids_history)
- Покупкой победителем
- Прямыми продажами
- Возвратом депозитов

---

### Шаг 5: Обновить UI

**artwork.html:**
- Показывать три роли (Creator, Auction Winner, Current Owner)
- Кнопка "Purchase" для победителя (если в течение 24 часов)
- Кнопка "Buy Now" для прямой покупки
- Таймер обратного отсчета для победителя
- История ставок с депозитами

**profile.html:**
- Показывать auction_winner_address
- Кнопка "Set For Sale" после аукциона
- Управление ценой прямой продажи

**gallery.html:**
- Показывать auction winner на карточках

---

## ⚠️ ВАЖНО

1. **Старые контракты останутся работать** - это новая версия, не обновление
2. **Нужно будет перенести данные** или начать с чистого листа
3. **Тестируй на testnet** перед mainnet деплоем
4. **Сохрани приватные ключи** для деплоя

---

## 📊 ТЕКУЩИЙ ПРОГРЕСС

- [x] Смарт-контракт написан
- [x] SQL миграция готова
- [x] Deployment скрипт готов
- [x] План переработки создан
- [ ] Деплой на Base Sepolia
- [ ] Деплой на Ethereum Sepolia
- [ ] SQL миграция запущена
- [ ] Frontend обновлен (contracts-integration.js)
- [ ] Backend обновлен (supabase-client.js)
- [ ] UI обновлен (artwork.html, profile.html, gallery.html)
- [ ] Тестирование

---

## 🔧 ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК

**Ошибка при деплое:**
- Проверь баланс кошелька (нужно ETH для gas)
- Проверь RPC endpoint в hardhat.config.js
- Проверь приватный ключ в .env

**Ошибка в SQL миграции:**
- Проверь что предыдущие миграции выполнены
- Проверь что таблицы artworks и auctions существуют
- Запусти миграцию по частям если нужно

**Контракт не работает:**
- Проверь что marketplace address установлен в NFT контракте
- Проверь что ABI обновлен в frontend
- Проверь что адреса контрактов правильные

---

## 📞 СЛЕДУЮЩИЙ ШАГ

**Сейчас нужно:**
1. Задеплоить контракты на Base Sepolia и Ethereum Sepolia
2. Запустить SQL миграцию в Supabase
3. Обновить адреса контрактов в frontend

После этого можно будет продолжить с обновлением frontend и UI!

---

*Создано: 2026-04-30*  
*Автор: Claude Sonnet 4*
