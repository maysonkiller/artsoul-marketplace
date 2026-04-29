# Вывод комиссий платформы

## 💰 Как работает система комиссий

### Текущие настройки:
- **Platform Fee**: 2.5% от каждой продажи
- **Royalty Fee**: 7.5% при перепродаже NFT
- **Owner**: Адрес кошелька, который задеплоил контракт

### Как накапливаются комиссии:

При каждой продаже artwork через аукцион:
1. Покупатель платит полную сумму
2. Платформа берет 2.5% комиссии
3. Создатель получает 97.5%
4. **Комиссия остается в контракте** и накапливается

**Пример:**
- Artwork продан за 1 ETH
- Платформа получает: 0.025 ETH (2.5%)
- Создатель получает: 0.975 ETH (97.5%)

---

## 🔑 Как вывести накопленные комиссии

### Вариант 1: Через консоль браузера (быстрый способ)

1. Откройте сайт и подключите кошелек **владельца контракта**
2. Откройте консоль браузера (F12)
3. Выполните команды:

```javascript
// Проверить, что вы владелец
const isOwner = await window.ArtSoulContracts.isOwner();
console.log('Вы владелец:', isOwner);

// Проверить баланс контракта
const balance = await window.ArtSoulContracts.getContractBalance();
console.log('Накоплено комиссий:', balance, 'ETH');

// Вывести все комиссии
const result = await window.ArtSoulContracts.withdrawFees();
console.log('✅ Выведено:', result.amount, 'ETH');
console.log('Transaction:', result.txHash);
```

### Вариант 2: Через UI (будет добавлено)

В будущем добавим специальную админ-панель с кнопкой "Withdraw Fees".

---

## 📊 Проверка статуса

### Проверить баланс контракта:
```javascript
const balance = await window.ArtSoulContracts.getContractBalance();
console.log('Доступно для вывода:', balance, 'ETH');
```

### Проверить процент комиссии:
```javascript
const fee = await window.ArtSoulContracts.getPlatformFee();
console.log('Комиссия платформы:', fee, '%');
```

### Проверить, что вы владелец:
```javascript
const isOwner = await window.ArtSoulContracts.isOwner();
if (isOwner) {
    console.log('✅ Вы владелец контракта');
} else {
    console.log('❌ Вы НЕ владелец контракта');
}
```

---

## 🔒 Безопасность

### Кто может выводить комиссии?
**Только владелец контракта** (адрес, который задеплоил контракт).

Если попытается кто-то другой:
```
Error: Only contract owner can withdraw fees
```

### Адрес владельца контракта:
Проверить можно так:
```javascript
const owner = await window.ArtSoulContracts.marketplaceContract.owner();
console.log('Владелец контракта:', owner);
```

---

## 💡 Важные моменты

### 1. Комиссии накапливаются автоматически
Вам не нужно ничего делать - при каждой продаже комиссия автоматически остается в контракте.

### 2. Вывод на любой кошелек
При вызове `withdrawFees()` все средства отправляются на адрес владельца контракта.

### 3. Можно выводить в любое время
Нет ограничений по времени или минимальной сумме.

### 4. Gas fees
За вывод нужно заплатить gas fee (обычно ~$1-5 в зависимости от сети).

---

## 📈 Отслеживание доходов

### Посмотреть историю транзакций:
1. Откройте Etherscan/Basescan
2. Введите адрес контракта: `0xA927574ECdCc81349C112Cc49C2f71ab707a537E`
3. Вкладка "Internal Txns" - там все выводы комиссий

### Рассчитать общий доход:
```javascript
// Получить все события AuctionEnded
const filter = window.ArtSoulContracts.marketplaceContract.filters.AuctionEnded();
const events = await window.ArtSoulContracts.marketplaceContract.queryFilter(filter);

let totalSales = 0;
events.forEach(event => {
    const amount = ethers.formatEther(event.args.amount);
    totalSales += parseFloat(amount);
});

const totalFees = totalSales * 0.025; // 2.5%
console.log('Всего продаж:', totalSales, 'ETH');
console.log('Всего комиссий:', totalFees, 'ETH');
```

---

## 🚀 Mainnet vs Testnet

### Testnet (Base Sepolia):
- Используйте для тестирования
- Деньги не настоящие
- Можно выводить сколько угодно раз

### Mainnet (Base):
- **Настоящие деньги!**
- Будьте осторожны
- Проверяйте адреса дважды
- Используйте hardware wallet для больших сумм

---

## ❓ FAQ

**Q: Как часто нужно выводить комиссии?**
A: Когда захотите. Рекомендуется раз в неделю/месяц чтобы экономить на gas.

**Q: Можно ли изменить процент комиссии?**
A: Да, есть функция `setPlatformFee()` (только для владельца). Максимум 10%.

**Q: Что если я потеряю доступ к кошельку владельца?**
A: Комиссии останутся в контракте навсегда. **Храните seed phrase в безопасности!**

**Q: Можно ли передать права владельца другому адресу?**
A: Да, контракт наследует `Ownable` от OpenZeppelin, есть функция `transferOwnership()`.

**Q: Комиссии в ETH или в токенах?**
A: В нативной валюте сети (ETH на Ethereum, ETH на Base).

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте, что подключен правильный кошелек (владелец)
2. Проверьте, что выбрана правильная сеть
3. Проверьте баланс контракта
4. Проверьте консоль браузера на ошибки

**Контракт Marketplace**: `0xA927574ECdCc81349C112Cc49C2f71ab707a537E` (Base Sepolia)

---

**Последнее обновление**: 2026-04-29
