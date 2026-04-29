# ArtSoul Marketplace - Архитектура
Дата: 2026-04-28

## Поддерживаемые сети

### Production:
- **Base** (основная сеть для продаж)
- **Ethereum** (престижная сеть)
- **Rialo** (экспериментальная сеть)

### Testing:
- **Base Sepolia** (тестовая сеть Base)
- **Sepolia** (тестовая сеть Ethereum)

## Типы контента

Все типы контента минтятся как NFT (ERC-721):
- 🖼️ Изображения (JPG, PNG, WebP)
- 🎬 Видео (MP4, WebM)
- 🎵 Музыка (MP3, WAV, FLAC)
- 🎞️ GIF анимации

## Хранение файлов

**Гибридный подход: Supabase + IPFS**

```
Загрузка → Supabase Storage (быстро, CDN) → Фоновая загрузка в IPFS
                                                      ↓
                                            Метаданные NFT в IPFS
```

**Почему так:**
- ✅ Быстрая загрузка через Supabase CDN
- ✅ Децентрализация через IPFS
- ✅ Соответствие стандарту ERC-721 metadata

## Система минтинга

### Lazy Mint (при продаже победителю)

```
1. Художник загружает artwork
   ↓
2. Файл → Supabase Storage + IPFS
   ↓
3. Запись в БД (artworks + auctions)
   ↓
4. NFT НЕ минтится (экономия gas)
   ↓
5. Аукцион 3 дня
   ↓
6. Победитель определен
   ↓
7. Автор нажимает "Sell to Winner"
   ↓
8. NFT минтится → Передается победителю
   ↓
9. Автор получает деньги (минус 2.5% комиссия)
```

**Преимущества:**
- Автор не платит gas при загрузке
- NFT создается только при реальной продаже
- Экономия средств если artwork не продался

## Dual Valuation System

Каждое artwork имеет 2 оценки:

### 1. Creator Value (Оценка автора)
- Устанавливается автором при загрузке
- Не влияет на аукцион
- Показывает во сколько автор оценивает свою работу
- Видна всем пользователям

### 2. Community Value (Оценка сообщества)
- Формируется из голосования сообщества
- Пользователи голосуют: undervalued, fair, overvalued
- Обновляется в реальном времени
- Показывает реальное мнение сообщества

**Пример:**
```
🎨 "Sunset Dreams" by @artist123

Creator Value:    1.5 ETH  (автор оценил)
Community Votes:  45% undervalued, 30% fair, 25% overvalued
```

## Система аукционов

### Правила ставок:

✅ **Разрешено:**
- Любой зарегистрированный пользователь может ставить
- Можно перебивать ставки других пользователей
- Можно ставить несколько раз (перебивая других)
- Побеждает самая высокая ставка через 3 дня

❌ **Запрещено:**
- Автор artwork НЕ может ставить на свой аукцион
- Нельзя перебивать свою собственную ставку
- Нельзя отменить ставку после размещения

### Пример аукциона:

```
День 1, 10:00 - User A ставит 0.5 ETH ✅
День 1, 15:00 - User B ставит 1.0 ETH ✅ (перебил A)
День 2, 09:00 - User A ставит 1.5 ETH ✅ (перебил B)
День 2, 14:00 - User A ставит 2.0 ETH ❌ (нельзя перебивать себя)
День 2, 16:00 - User C ставит 2.0 ETH ✅ (перебил A)
День 3, 23:59 - Аукцион закончился

Победитель: User C с 2.0 ETH
```

### Длительность аукциона:
- **3 дня** (72 часа) с момента загрузки
- Автоматическое завершение
- Таймер обратного отсчета на странице artwork

## После аукциона

### Вариант 1: Продажа победителю (рекомендуется)

```
Аукцион закончился
    ↓
Автор видит: "🏆 User C выиграл с 2.0 ETH"
    ↓
Кнопка "Sell to Winner"
    ↓
Автор нажимает → Транзакция → NFT минтится
    ↓
NFT передается User C
    ↓
Автор получает: 1.95 ETH (2.0 - 2.5% комиссия)
Платформа получает: 0.05 ETH
```

### Вариант 2: Прямая продажа

```
Автор НЕ продал победителю
    ↓
"List for Direct Sale"
    ↓
Установить цену ≥ Floor Price (2.0 ETH)
    ↓
Любой может купить по фиксированной цене
    ↓
NFT минтится при покупке
```

### Вариант 3: Новый аукцион

```
Автор НЕ продал победителю
    ↓
"Create New Auction"
    ↓
Новый 3-дневный аукцион
    ↓
Цикл повторяется
```

## Floor Price (Минимальная цена)

### Жесткий флор (Вариант A)

**Правило:** После первой продажи нельзя продавать дешевле

```
Первая продажа: 2.0 ETH
    ↓
Floor Price = 2.0 ETH (навсегда)
    ↓
При перепродаже: цена должна быть ≥ 2.0 ETH
```

**Преимущества:**
- ✅ NFT не обесценивается
- ✅ Защита инвестиций покупателей
- ✅ Поддержка ценности artwork

**Недостатки:**
- ⚠️ Может быть сложно продать если рынок упал
- ⚠️ Меньше гибкости

**Применение:**
- Используется для первой версии платформы
- Можно сделать гибче в будущем на основе feedback

## Смарт-контракты

### 1. ArtSoulNFT.sol (ERC-721)

```solidity
// Основные функции:
- lazyMint(to, tokenURI, creator) - минт при продаже
- setRoyalty(tokenId, percentage) - роялти для автора
- getCreator(tokenId) - получить автора (навсегда)
- tokenURI(tokenId) - метаданные из IPFS
```

**Особенности:**
- Автор сохраняется навсегда (даже после продажи)
- Роялти 5% автору при каждой перепродаже
- Метаданные в IPFS (стандарт ERC-721)

### 2. ArtSoulMarketplace.sol

```solidity
// Основные функции:
- createAuction(artworkId, startPrice) - создать аукцион
- placeBid(auctionId, amount) - сделать ставку
- endAuction(auctionId) - завершить аукцион
- sellToWinner(auctionId) - продать победителю
- listForSale(tokenId, price) - прямая продажа
- buy(tokenId) - купить по фиксированной цене
```

**Особенности:**
- 3-дневные аукционы
- Одна ставка на пользователя (можно обновлять)
- Автоматическое определение победителя
- Комиссия платформы 2.5%
- Роялти автору 5%
- Проверка floor price

## База данных (Supabase)

### Таблицы:

**profiles** - профили пользователей
```sql
- id (UUID)
- wallet_address (TEXT, UNIQUE)
- username (TEXT)
- bio (TEXT)
- avatar_url (TEXT)
- twitter_handle, discord_username
```

**artworks** - загруженные работы
```sql
- id (UUID)
- title, description
- file_url (Supabase)
- ipfs_url (IPFS)
- file_type (image/video/music/gif)
- creator_id (FK → profiles)
- creator_estimated_value (DECIMAL) - Creator Value
- token_id (INT, nullable) - ID NFT после минта
- contract_address (TEXT, nullable)
- chain_id (INT) - на какой сети
```

**auctions** - аукционы
```sql
- id (UUID)
- artwork_id (FK → artworks)
- start_time, end_time (3 дня)
- status (active/ended/cancelled)
- winner_id (FK → profiles)
- winning_bid_amount (DECIMAL)
- floor_price (DECIMAL) - после первой продажи
```

**bids** - ставки
```sql
- id (UUID)
- auction_id (FK → auctions)
- bidder_id (FK → profiles)
- amount (DECIMAL)
- tx_hash (TEXT) - хеш транзакции
- created_at
- UNIQUE(auction_id, bidder_id) - одна ставка на пользователя
```

**sales** - история продаж
```sql
- id (UUID)
- artwork_id (FK → artworks)
- seller_id, buyer_id (FK → profiles)
- price (DECIMAL)
- sale_type (auction/direct)
- tx_hash (TEXT)
- created_at
```

## UI/UX Flow

### 1. Загрузка artwork

```
Profile → Upload → Выбрать файл → Заполнить форму:
  - Title
  - Description
  - Creator Estimated Value (ETH)
  - Select Network (Base/Ethereum/Rialo)
→ Upload → Файл загружается → Artwork создан
→ Можно создать аукцион из профиля
```

### 2. Просмотр artwork

```
Gallery → Click artwork → Страница artwork:

┌─────────────────────────────────────┐
│  [Artwork Preview]                  │
│                                     │
│  "Sunset Dreams"                    │
│  by @artist123 (кликабельно)        │
│                                     │
│  📊 Valuation:                      │
│  Creator:    1.5 ETH                │
│                                     │
│  🗳️ Community Voting:               │
│  45% undervalued                    │
│  30% fair                           │
│  25% overvalued                     │
│  [Vote: Undervalued/Fair/Overvalued]│
│                                     │
│  ⏰ Auction ends in: 1d 5h 23m      │
│                                     │
│  🏆 Current Leader:                 │
│  @user_c with 2.0 ETH               │
│                                     │
│  📜 Bid History:                    │
│  @user_c - 2.0 ETH (2h ago)         │
│  @user_a - 1.5 ETH (1d ago)         │
│  @user_b - 1.0 ETH (2d ago)         │
│                                     │
│  [Place Bid] [Share]                │
└─────────────────────────────────────┘
```

### 3. Размещение ставки

```
Click "Place Bid" → Modal:
  - Current highest: 2.0 ETH
  - Your bid: [___] ETH (min 2.01)
  - Network: Base
  - Gas estimate: ~$0.02
→ Confirm → Wallet signature → Tx sent
→ Success: "Your bid placed! 🎉"
```

### 4. После аукциона (автор)

```
Profile → My Artworks → "Sunset Dreams":

┌─────────────────────────────────────┐
│  🏆 Auction Ended!                  │
│                                     │
│  Winner: @user_c                    │
│  Winning Bid: 2.0 ETH               │
│                                     │
│  [Sell to Winner]                   │
│  You'll receive: 1.95 ETH           │
│  (2.0 - 2.5% fee)                   │
│                                     │
│  Or:                                │
│  [List for Direct Sale]             │
│  [Create New Auction]               │
└─────────────────────────────────────┘
```

## Roadmap обновление

### Q2 2026 ✅
- MVP platform
- Basic UI/UX
- Upload system
- Profiles
- Wallet connection (Base, Ethereum, Rialo, Sepolia)

### Q3 2026 🔄
- Smart contracts deployment (Base, Ethereum, Rialo)
- Lazy minting system
- Auction mechanism
- IPFS integration
- Community Voting System

### Q4 2026
- Direct sales (post-auction)
- Floor price enforcement
- Royalty system
- Social features (share to X, Discord)
- Mobile responsive design
- Advanced analytics

### 2027
- Multi-chain expansion
- DAO governance
- Gallery partnerships
- Creator tools
- Mobile app

## Технический стек

### Frontend:
- React 18
- TailwindCSS
- Reown AppKit (wallet connection)
- Wagmi (Web3 hooks)

### Backend:
- Supabase (database, auth, storage)
- IPFS (decentralized storage)
- Claude API (AI valuation)

### Blockchain:
- Solidity 0.8.x
- Hardhat (development)
- OpenZeppelin (contracts)
- Ethers.js (Web3 library)

### Networks:
- Base (production)
- Ethereum (production)
- Rialo (production)
- Base Sepolia (testing)
- Sepolia (testing)

## Комиссии

- **Платформа:** 2.5% от каждой продажи
- **Роялти автору:** 5% от каждой перепродажи
- **Gas fees:** оплачивает покупатель

**Пример:**
```
Первая продажа: 2.0 ETH
  → Автор получает: 1.95 ETH (2.0 - 2.5%)
  → Платформа: 0.05 ETH

Перепродажа: 3.0 ETH
  → Продавец получает: 2.775 ETH (3.0 - 2.5% - 5%)
  → Платформа: 0.075 ETH
  → Автор (роялти): 0.15 ETH
```

## Безопасность

### Smart Contracts:
- Reentrancy protection
- Access control (Ownable)
- Pausable (emergency stop)
- Audit перед mainnet

### Frontend:
- Signature verification
- Rate limiting
- CSRF protection
- XSS prevention

### Database:
- Row Level Security (RLS)
- Prepared statements
- Input validation
- Encrypted sensitive data

---

**Версия:** 1.0  
**Дата:** 2026-04-28  
**Статус:** Утверждено
