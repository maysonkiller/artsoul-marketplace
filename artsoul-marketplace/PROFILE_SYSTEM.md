# Profile System - Documentation

**Created:** 2026-04-22
**Status:** ✅ Live

## 🎯 Features

### User Profile

#### Profile Setup (First Time):
- ✅ **Avatar Upload** - загрузи свою фотографию
- ✅ **Name** - твое имя или псевдоним
- ✅ **Bio** - расскажи о себе
- ✅ **Social Links** - Twitter/X, Instagram, Discord

#### Profile Display:
- Красивая карточка профиля
- Аватар с рамкой (синяя для Brutal, неоновая для Future)
- Социальные ссылки с иконками
- Кнопка Edit Profile

### Personal Galleries

6 типов галерей для организации твоих работ:

1. **🎨 NFT Gallery** - твои NFT артворки
2. **🎬 Video Gallery** - видео работы
3. **🎵 Music Gallery** - музыкальные треки
4. **🎞️ GIF Gallery** - анимированные GIF
5. **🖼️ Image Gallery** - цифровые изображения
6. **🎭 Physical Art** - фото реального искусства

### Quick Upload System

**Умная загрузка прямо из галереи:**

1. Выбери галерею (например, Video Gallery)
2. Нажми на пустую иконку или кнопку "➕ Add New"
3. Система автоматически откроет загрузку **для этого типа**
4. Форма уже настроена под выбранный тип!

**Пример:**
- Нажал на иконку в Video Gallery → форма для видео (Duration, Resolution, FPS)
- Нажал на иконку в Music Gallery → форма для музыки (Genre, Duration, BPM)

## 🎨 UI Features

### Brutal Theme:
- Чистый белый фон
- Синие акценты
- Классические тени
- Профессиональный вид

### Future Theme:
- Темный фон с градиентами
- Неоновые рамки (cyan/purple)
- Glow эффекты на аватаре
- Футуристичный стиль

### Animations:
- ✅ Fade-in при загрузке
- ✅ Hover эффекты на галереях
- ✅ Scale transform на кнопках
- ✅ Плавные transitions

## 📱 User Flow

### First Time Setup:
1. Нажми "👤 Profile" в header
2. Система определит, что профиль не создан
3. Автоматически откроется режим редактирования
4. Заполни информацию
5. Нажми "Save Profile"

### Regular Use:
1. Открой профиль
2. Выбери галерею (NFT, Video, Music, etc.)
3. Нажми на пустую иконку
4. Загрузи файл нужного типа
5. Артворк появится в твоей галерее!

## 💾 Storage

### Profile Data:
```javascript
{
  name: "Artist Name",
  avatar: "base64_image_data",
  bio: "About me...",
  socials: {
    twitter: "handle",
    instagram: "handle",
    discord: "username"
  },
  galleries: {}
}
```

Сохраняется в `localStorage` под ключом `userProfile`

### Artworks:
Загруженные работы автоматически фильтруются по типу и показываются в соответствующих галереях.

## 🔗 Integration

### With Upload System:
- Клик на иконку в галерее → redirect на upload.html
- Передается тип файла через URL параметр
- Форма загрузки уже настроена под нужный тип

### With Main Gallery:
- Все загруженные работы появляются в главной галерее
- И в персональной галерее профиля
- Синхронизация через localStorage

## 🌐 URLs

**Profile Page:** https://maysonkiller.github.io/artsoul-marketplace/profile.html

**Main Gallery:** https://maysonkiller.github.io/artsoul-marketplace/artsoul.html

**Upload:** https://maysonkiller.github.io/artsoul-marketplace/upload.html

## 🎯 Smart Features

### Auto Gallery Detection:
Система автоматически определяет, в какую галерею поместить артворк:
- NFT → NFT Gallery
- Video → Video Gallery
- Music → Music Gallery
- GIF → GIF Gallery
- Image/Digital Art → Image Gallery
- Physical Art → Physical Art Gallery

### Empty State:
Если в галерее нет работ:
- Показываются 8 пустых иконок
- Каждая кликабельна для быстрой загрузки
- Hover эффект показывает интерактивность

### Social Links:
- Twitter → открывается профиль twitter.com/handle
- Instagram → открывается instagram.com/handle
- Discord → показывается username (не ссылка)

## 🚀 Next Steps

### Phase 1: Enhanced Profile
- [ ] Cover image (баннер)
- [ ] Статистика (total artworks, total bids, followers)
- [ ] Verified badge для известных художников

### Phase 2: Social Features
- [ ] Follow/Unfollow других художников
- [ ] Лента активности
- [ ] Комментарии на артворках

### Phase 3: Advanced Galleries
- [ ] Сортировка (по дате, цене, популярности)
- [ ] Приватные галереи
- [ ] Коллекции (группировка артворков)

### Phase 4: Web3
- [ ] Wallet address в профиле
- [ ] ENS domain support
- [ ] On-chain profile (NFT profile picture)

## 📊 Technical Details

```javascript
// Gallery types configuration
const GALLERY_TYPES = [
    { id: 'nft', label: 'NFT Gallery', icon: '🎨', fileType: 'Image' },
    { id: 'video', label: 'Video Gallery', icon: '🎬', fileType: 'Video' },
    { id: 'music', label: 'Music Gallery', icon: '🎵', fileType: 'Music' },
    { id: 'gif', label: 'GIF Gallery', icon: '🎞️', fileType: 'GIF' },
    { id: 'image', label: 'Image Gallery', icon: '🖼️', fileType: 'Image' },
    { id: 'physical', label: 'Physical Art', icon: '🎭', fileType: 'Image' },
];

// Filter artworks by gallery type
const getGalleryArtworks = (galleryType) => {
    const allArtworks = JSON.parse(localStorage.getItem('artworks') || '[]');
    return allArtworks.filter(art => {
        if (galleryType === 'nft') return art.type === 'NFT';
        if (galleryType === 'video') return art.type === 'Video';
        // ... etc
    });
};
```

## ✨ Result

Полнофункциональная система профилей с персональными галереями и быстрой загрузкой для каждого типа контента!

**Try it:** https://maysonkiller.github.io/artsoul-marketplace/profile.html
