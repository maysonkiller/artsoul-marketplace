# ArtSoul Marketplace - Supabase Integration Guide

## Настройка базы данных

### 1. Создание таблиц в Supabase

1. Откройте https://supabase.com/dashboard
2. Выберите проект `bexigvqrunomwtjsxlej`
3. Перейдите в **SQL Editor**
4. Скопируйте содержимое файла `supabase-schema.sql`
5. Вставьте в SQL Editor и нажмите **Run**

### 2. Проверка таблиц

После выполнения SQL должны быть созданы:
- ✅ `profiles` - профили пользователей
- ✅ `artworks` - произведения искусства
- ✅ `auctions` - аукционы (3 дня)
- ✅ `bids` - ставки (одна на пользователя)

### 3. Настройка Storage (для загрузки файлов)

1. Перейдите в **Storage** → **Create bucket**
2. Создайте bucket с именем `artworks`
3. Настройте политики доступа:
   - Public: `true` (для просмотра)
   - Upload: только авторизованные пользователи

## Интеграция с фронтендом

### Подключение клиента

Добавьте в `<head>` каждой страницы:

```html
<script type="module" src="supabase-client.js"></script>
```

### Использование API

#### Создание профиля после подключения кошелька

```javascript
// В index.html после успешного подключения кошелька
async function handleSuccessfulLogin(state) {
    const walletAddress = state.address;
    
    // Проверяем есть ли профиль
    const profile = await window.ArtSoulDB.getProfile(walletAddress);
    
    if (!profile) {
        // Первый раз - редирект на создание профиля
        window.location.href = 'profile.html';
    } else {
        // Профиль существует
        console.log('Welcome back!', profile);
    }
}
```

#### Сохранение профиля (profile.html)

```javascript
document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const walletAddress = window.currentWalletAddress; // Из AppKit state
    
    const profileData = {
        username: document.getElementById('username').value,
        bio: document.getElementById('bio').value,
        twitter: document.getElementById('twitter').value,
        discord: document.getElementById('discord').value,
        vk: document.getElementById('vk').value
    };
    
    try {
        // Проверяем существует ли профиль
        const existing = await window.ArtSoulDB.getProfile(walletAddress);
        
        if (existing) {
            // Обновляем
            await window.ArtSoulDB.updateProfile(walletAddress, profileData);
        } else {
            // Создаём новый
            await window.ArtSoulDB.createProfile(walletAddress, profileData);
        }
        
        alert('Profile saved!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile');
    }
};
```

#### Загрузка artwork (upload.html)

```javascript
async function handleUpload() {
    const file = selectedFile;
    const title = document.getElementById('artTitle').value;
    const description = document.getElementById('artDescription').value;
    const estimatedValue = document.getElementById('artPrice').value;
    
    try {
        // 1. Загрузить файл в Supabase Storage
        const supabase = await window.ArtSoulDB.initSupabase();
        const fileName = `${Date.now()}_${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artworks')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Получить публичный URL
        const { data: { publicUrl } } = supabase.storage
            .from('artworks')
            .getPublicUrl(fileName);
        
        // 3. Получить ID профиля создателя
        const profile = await window.ArtSoulDB.getProfile(window.currentWalletAddress);
        
        // 4. Создать запись artwork
        const artwork = await window.ArtSoulDB.createArtwork({
            title: title,
            description: description,
            file_url: publicUrl,
            file_type: detectFileType(file),
            creator_id: profile.id,
            creator_estimated_value: estimatedValue
        });
        
        // 5. Создать аукцион на 3 дня
        const auction = await window.ArtSoulDB.createAuction(artwork.id);
        
        alert('Artwork uploaded and auction started!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading artwork');
    }
}
```

#### Отображение аукционов (index.html)

```javascript
async function loadAuctions() {
    try {
        const auctions = await window.ArtSoulDB.getActiveAuctions();
        
        auctions.forEach(auction => {
            console.log('Auction:', auction);
            console.log('Artwork:', auction.artwork);
            console.log('Creator:', auction.artwork.creator);
            console.log('Current winner:', auction.winner);
            console.log('Winning bid:', auction.winning_bid_amount);
            console.log('Total bids:', auction.bids[0].count);
        });
        
        // Отобразить в UI
        renderAuctions(auctions);
    } catch (error) {
        console.error('Error loading auctions:', error);
    }
}
```

#### Размещение ставки

```javascript
async function placeBid(auctionId, amount) {
    try {
        const profile = await window.ArtSoulDB.getProfile(window.currentWalletAddress);
        
        const bid = await window.ArtSoulDB.placeBid(
            auctionId,
            profile.id,
            amount,
            amount * 1.1 // max_bid_limit на 10% выше
        );
        
        alert('Bid placed successfully!');
        
        // Обновить UI
        loadAuctionDetails(auctionId);
    } catch (error) {
        console.error('Error placing bid:', error);
        alert('Error placing bid');
    }
}
```

#### Real-time обновления ставок

```javascript
// Подписка на изменения в аукционе
window.ArtSoulDB.subscribeToAuction(auctionId, (payload) => {
    console.log('New bid:', payload);
    
    // Обновить UI с новой ставкой
    loadAuctionDetails(auctionId);
});
```

## Важные моменты

### Логика аукциона

1. **Автор создаёт artwork** → автоматически создаётся аукцион на 3 дня
2. **Пользователи делают ставки** → каждый может сделать только ОДНУ ставку (но может обновить её)
3. **Через 3 дня аукцион заканчивается** → победитель (самая высокая ставка) получает право выставить работу на продажу
4. **Автор всегда остаётся автором** → даже после перепродажи
5. **История ставок видна всем** → для интриги и прозрачности

### Безопасность

- Row Level Security (RLS) включен на всех таблицах
- Пользователи могут редактировать только свои данные
- Все могут читать публичные данные (профили, artwork, ставки)

### Storage политики

Создайте политику для загрузки файлов:

```sql
-- В Supabase Dashboard → Storage → artworks → Policies
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artworks');

CREATE POLICY "Public can view"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'artworks');
```

## Следующие шаги

1. ✅ Выполнить SQL схему в Supabase
2. ✅ Создать Storage bucket `artworks`
3. ✅ Настроить политики Storage
4. ⏳ Интегрировать `supabase-client.js` в HTML страницы
5. ⏳ Обновить логику profile.html для работы с БД
6. ⏳ Обновить логику upload.html для загрузки в Storage
7. ⏳ Обновить index.html для отображения аукционов из БД

## Тестирование

После интеграции проверьте:
- [ ] Создание профиля после подключения кошелька
- [ ] Загрузка artwork и создание аукциона
- [ ] Размещение ставок
- [ ] Обновление ставки (один пользователь = одна ставка)
- [ ] Real-time обновления при новых ставках
- [ ] Завершение аукциона через 3 дня
