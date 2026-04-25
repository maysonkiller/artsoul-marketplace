# Upload System - Documentation

**Created:** 2026-04-22
**Status:** ✅ Live

## 🎯 Features

### Smart File Detection

Система автоматически определяет тип загруженного файла:

- **Image** (JPG, PNG, WebP, etc.)
- **Video** (MP4, WebM, MOV, etc.)
- **Music** (MP3, WAV, OGG, etc.)
- **GIF** (анимированные изображения)

### Dynamic Forms

Для каждого типа файла показываются **разные поля формы**:

#### Базовые поля (для всех типов):
- ✅ Title (название)
- ✅ Description (описание)
- ✅ Artist Estimate (оценка автора в ETH)

#### Image:
- Medium (техника: Digital, Oil, Watercolor)
- Dimensions (размеры)
- Year Created (год создания)

#### Video:
- Duration (длительность)
- Resolution (разрешение)
- FPS (кадры в секунду)

#### Music:
- Genre (жанр)
- Duration (длительность)
- BPM (темп)

#### GIF:
- Loop Duration (длительность цикла)
- Frame Count (количество кадров)

## 🎨 UI Features

### Drag & Drop
- Перетащи файл в зону загрузки
- Визуальная индикация при наведении
- Поддержка клика для выбора файла

### Live Preview
- **Images/GIFs**: показывается превью
- **Videos**: видео плеер с контролами
- **Music**: аудио плеер + иконка 🎵

### Adaptive Design
- Работает в обоих темах (Brutal & Future)
- Анимации появления полей
- Hover эффекты на кнопках

## 💾 Storage

### Current (Prototype):
- **localStorage** - данные сохраняются в браузере
- Артворки появляются в галерее после загрузки
- Превью сохраняется как base64

### Future Integration:

#### IPFS (Decentralized):
```javascript
// Будущая интеграция
import { create } from 'ipfs-http-client'
const ipfs = create({ url: 'https://ipfs.infura.io:5001' })
const { cid } = await ipfs.add(file)
```

#### Backend API:
```javascript
// Будущая интеграция
const formData = new FormData()
formData.append('file', file)
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
```

## 🔗 URLs

**Upload Page:** https://maysonkiller.github.io/artsoul-marketplace/upload.html

**Main Gallery:** https://maysonkiller.github.io/artsoul-marketplace/artsoul.html

## 📱 User Flow

1. **Click "📤 Upload"** в header
2. **Drag & Drop** или выбери файл
3. **Система определяет тип** автоматически
4. **Заполни форму** (поля адаптируются под тип)
5. **Submit to Auction**
6. **Редирект на галерею** - твой артворк появился!

## 🎯 Smart Features

### Auto-fill Title
Название файла автоматически подставляется в поле Title (без расширения)

### File Size Display
Показывается размер файла в MB

### Validation
- Required поля помечены звездочкой *
- HTML5 валидация форм
- Проверка размера файла (макс 100MB)

### Artist Estimate Info
Подсказка: "This is just for reference, community will set the floor price"

## 🔄 Integration with Gallery

Загруженные артворки:
- ✅ Появляются в галерее
- ✅ Доступны для фильтрации по типу
- ✅ Можно выбрать и сделать ставку
- ✅ Сохраняются между сессиями (localStorage)

## 🚀 Next Steps

### Phase 1: Backend
- [ ] Node.js/Express API
- [ ] File upload to cloud storage
- [ ] Database для метаданных

### Phase 2: IPFS
- [ ] Интеграция IPFS
- [ ] Pinning service (Pinata/Infura)
- [ ] CID хранение в blockchain

### Phase 3: Web3
- [ ] NFT minting при загрузке
- [ ] Wallet verification
- [ ] On-chain metadata

### Phase 4: Advanced
- [ ] Image compression
- [ ] Video transcoding
- [ ] Thumbnail generation
- [ ] Multiple file upload

## 🎨 Design Highlights

### Brutal Theme:
- Чистые белые карточки
- Синие акценты
- Профессиональный вид

### Future Theme:
- Неоновые градиенты (pink → purple)
- Glow эффекты
- Футуристичный стиль

## 📊 Technical Details

```javascript
// File type detection
const detectFileType = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Music';
    if (type === 'image/gif') return 'GIF';
    return 'Other';
};

// Dynamic form fields
const getFormFields = (fileType) => {
    // Returns different fields based on type
};

// Save to localStorage
localStorage.setItem('artworks', JSON.stringify(artworks));
```

## ✨ Result

Полнофункциональная система загрузки с умным определением типа файла и адаптивными формами!

**Try it:** https://maysonkiller.github.io/artsoul-marketplace/upload.html
