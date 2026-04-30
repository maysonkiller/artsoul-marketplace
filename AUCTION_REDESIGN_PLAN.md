# ПЛАН ПЕРЕРАБОТКИ СИСТЕМЫ АУКЦИОНОВ И ПРОДАЖ

**Дата:** 2026-04-30  
**Цель:** Переработать логику маркетплейса согласно новой концепции

---

## 🎯 НОВАЯ КОНЦЕПЦИЯ

### Аукцион = Установка Floor Price (НЕ продажа)

**Что происходит:**
1. Художник создает аукцион (3 дня)
2. Участники делают ставки с депозитом 10%
3. Аукцион завершается:
   - Победитель получает право первой покупки (24 часа)
   - Floor price устанавливается = highest bid
   - Депозиты возвращаются всем участникам
4. Если победитель покупает в течение 24 часов:
   - NFT минтится и передается ему
   - Депозит засчитывается в оплату
   - Статус: SOLD
5. Если победитель НЕ покупает:
   - Право покупки переходит к следующему участнику
   - Если никто не покупает → статус FOR_SALE
6. После аукциона художник может продавать напрямую (цена >= floor_price)

### Три роли:

1. **Creator** (создатель) - всегда один, не меняется
2. **Auction Winner** (победитель аукциона) - почетное звание, не меняется
3. **Current Owner** (текущий владелец) - меняется при каждой продаже

---

## 📋 ЧТО НУЖНО ИЗМЕНИТЬ

### 1. СМАРТ-КОНТРАКТЫ

#### ArtSoulMarketplace.sol - Изменения:

**Новые статусы:**
```solidity
enum ArtworkStatus {
    DRAFT,              // Загружено, не на аукционе
    AUCTION,            // На аукционе
    AUCTION_ENDED,      // Аукцион завершен, ждет покупки победителя
    FOR_SALE,           // Доступно для прямой покупки
    SOLD,               // Продано и заминчено
    UNLISTED            // Удалено
}
```

**Новая структура Auction:**
```solidity
struct Auction {
    uint256 artworkId;
    uint256 startTime;
    uint256 endTime;
    uint256 startingPrice;
    uint256 highestBid;
    address highestBidder;
    address auctionWinner;      // NEW: Победитель аукциона (не меняется)
    uint256 winnerDeadline;     // NEW: Дедлайн для покупки победителем
    bool ended;
    bool winnerPurchased;       // NEW: Купил ли победитель
}
```

**Новая структура Bid:**
```solidity
struct Bid {
    address bidder;
    uint256 amount;         // Полная сумма ставки
    uint256 deposit;        // Депозит 10%
    bool refunded;          // Возвращен ли депозит
    uint256 timestamp;
}
```

**Новая структура Artwork:**
```solidity
struct Artwork {
    uint256 id;
    address creator;
    address auctionWinner;      // NEW: Победитель аукциона (почетное звание)
    address currentOwner;       // NEW: Текущий владелец NFT
    string ipfsHash;
    string metadataURI;
    bytes32 fileHash;
    uint256 creatorValue;       // Начальная цена
    uint256 floorPrice;         // NEW: Минимальная цена после аукциона
    uint256 salePrice;          // NEW: Цена для прямой продажи
    uint256 communityValue;
    uint256 systemValue;
    ArtworkStatus status;
    uint256 tokenId;
    uint256 createdAt;
}
```

**Новые функции:**

1. `placeBid()` - изменить для депозита 10%
2. `endAuction()` - НЕ минтить NFT, установить winner и deadline
3. `purchaseByWinner()` - NEW: Покупка победителем в течение 24 часов
4. `purchaseDirectly()` - NEW: Прямая покупка после аукциона
5. `refundDeposits()` - NEW: Возврат депозитов всем участникам
6. `setForSale()` - NEW: Выставить на прямую продажу после аукциона

#### ArtSoulNFT.sol - Без изменений
- Контракт NFT остается как есть
- Минтинг происходит только при реальной покупке

---

### 2. БАЗА ДАННЫХ

#### Новые поля в artworks:
```sql
ALTER TABLE artworks ADD COLUMN auction_winner_address TEXT;
ALTER TABLE artworks ADD COLUMN current_owner_address TEXT;
ALTER TABLE artworks ADD COLUMN floor_price DECIMAL(20, 8);
ALTER TABLE artworks ADD COLUMN sale_price DECIMAL(20, 8);
ALTER TABLE artworks ADD COLUMN winner_deadline TIMESTAMP;
```

#### Новая таблица bids_history:
```sql
CREATE TABLE bids_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id),
    bidder_address TEXT NOT NULL,
    bid_amount DECIMAL(20, 8) NOT NULL,
    deposit_amount DECIMAL(20, 8) NOT NULL,
    refunded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Обновить таблицу auctions:
```sql
ALTER TABLE auctions ADD COLUMN auction_winner_address TEXT;
ALTER TABLE auctions ADD COLUMN winner_deadline TIMESTAMP;
ALTER TABLE auctions ADD COLUMN winner_purchased BOOLEAN DEFAULT false;
```

---

### 3. FRONTEND

#### supabase-client.js - Новые функции:
- `getBidsHistory(auctionId)` - получить историю ставок
- `purchaseByWinner(artworkId)` - покупка победителем
- `purchaseDirectly(artworkId)` - прямая покупка
- `setForSale(artworkId, price)` - выставить на продажу

#### contracts-integration.js - Новые функции:
- `purchaseByWinner(artworkId)` - вызов контракта
- `purchaseDirectly(artworkId, price)` - вызов контракта
- `refundDeposits(artworkId)` - возврат депозитов
- `setForSale(artworkId, price)` - выставить на продажу

#### artwork.html - Изменения UI:
- Показывать три роли: Creator, Auction Winner, Current Owner
- Кнопка "Purchase" для победителя (если в течение 24 часов)
- Кнопка "Buy Now" для прямой покупки (если FOR_SALE)
- Таймер обратного отсчета для победителя
- История ставок с депозитами

#### profile.html - Изменения:
- Показывать auction_winner_address
- Кнопка "Set For Sale" после аукциона
- Управление ценой прямой продажи

---

## 🔄 ПОРЯДОК РЕАЛИЗАЦИИ

### Этап 1: Смарт-контракты (КРИТИЧНО)
1. ✅ Изучить текущие контракты
2. ⏳ Переписать ArtSoulMarketplace.sol
3. ⏳ Добавить новые функции и структуры
4. ⏳ Протестировать локально (Hardhat)
5. ⏳ Задеплоить на Base Sepolia
6. ⏳ Задеплоить на Ethereum Sepolia
7. ⏳ Обновить адреса в contracts-integration.js

### Этап 2: База данных
1. ⏳ Создать SQL миграцию для новых полей
2. ⏳ Создать таблицу bids_history
3. ⏳ Обновить триггеры
4. ⏳ Запустить миграции в Supabase

### Этап 3: Backend функции (supabase-client.js)
1. ⏳ Добавить новые функции для работы с аукционами
2. ⏳ Обновить существующие функции
3. ⏳ Добавить функции для истории ставок

### Этап 4: Blockchain интеграция (contracts-integration.js)
1. ⏳ Обновить ABI контрактов
2. ⏳ Добавить новые функции
3. ⏳ Обновить обработку событий

### Этап 5: UI обновления
1. ⏳ artwork.html - три роли, новые кнопки
2. ⏳ profile.html - управление продажами
3. ⏳ gallery.html - показывать auction winner
4. ⏳ index.html - обновить карточки

### Этап 6: Тестирование
1. ⏳ Тест: создание аукциона
2. ⏳ Тест: размещение ставок с депозитом
3. ⏳ Тест: завершение аукциона
4. ⏳ Тест: покупка победителем
5. ⏳ Тест: прямая покупка
6. ⏳ Тест: возврат депозитов
7. ⏳ Тест: отображение трех ролей

---

## ⚠️ ВАЖНЫЕ МОМЕНТЫ

1. **Депозит 10%:**
   - При ставке 1 ETH, пользователь платит 0.1 ETH депозит
   - Депозит возвращается после аукциона
   - Если победитель покупает, депозит засчитывается

2. **24 часа для победителя:**
   - После завершения аукциона у победителя 24 часа
   - Если не покупает, право переходит к следующему
   - Нужен механизм автоматической проверки (cron или manual)

3. **Floor Price:**
   - Устанавливается = highest bid
   - Художник не может продавать дешевле
   - Можно продавать дороже

4. **Auction Winner - почетное звание:**
   - Записывается один раз
   - Не меняется при перепродажах
   - Показывается на странице artwork

5. **Current Owner:**
   - Меняется при каждой продаже
   - Показывается на странице artwork
   - Может перепродавать NFT

---

## 📊 ОЦЕНКА ВРЕМЕНИ

- Смарт-контракты: 2-3 часа
- База данных: 30 минут
- Backend функции: 1 час
- Blockchain интеграция: 1 час
- UI обновления: 2 часа
- Тестирование: 1-2 часа

**Итого: 7-9 часов работы**

---

## 🚀 НАЧИНАЕМ!

Следующий шаг: Переписать ArtSoulMarketplace.sol
