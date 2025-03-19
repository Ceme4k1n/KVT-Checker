# Комплект измерения температуры и влажности (КВТ)

Система для автоматического измерения температуры и влажности с использованием датчиков "С2000-ВТ", обработки, хранения с привязкой по времени и подготовки информации для отображения.

## Возможности

- Поддержка комплектов КВТ-10, КВТ-20, КВТ-40, КВТ-60
- Автоматическое измерение температуры и влажности
- Обработка и хранение данных с привязкой по времени
- Визуализация данных через веб-интерфейс
- Уведомления о превышении пороговых значений
- Логирование всех операций
- Поддержка различных интерфейсов уведомлений (Email, Telegram)

## Требования

- Node.js 14 или выше
- SQLite3
- Доступ к COM-порту для работы с Modbus RTU

## Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/your-username/kvt-checker.git
cd kvt-checker
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл конфигурации:

```bash
cp .env.example .env
```

4. Отредактируйте файл `.env` и настройте необходимые параметры.

## Запуск

1. Запуск сервера:

```bash
npm start
```

2. Запуск в режиме разработки:

```bash
npm run dev
```

## API Endpoints

### Датчики

- `GET /api/sensor/:id/measurements` - получение измерений датчика
- `GET /api/sensor/:id/statuses` - получение статусов датчика
- `POST /api/sensor` - добавление нового датчика
- `GET /api/sensor/:id/temperature/:zone` - чтение температуры с датчика
- `GET /api/sensor/:id/humidity/:zone` - чтение влажности с датчика
- `GET /api/sensor/:id/status/:zone` - чтение статуса датчика

### Измерения и статусы

- `POST /api/measurement` - сохранение измерений
- `POST /api/status` - сохранение статуса

## Структура базы данных

### Таблица sensors

- id (INTEGER PRIMARY KEY)
- name (TEXT)
- zones_count (INTEGER)
- temp_threshold_min (REAL)
- temp_threshold_max (REAL)
- humidity_threshold_min (REAL)
- humidity_threshold_max (REAL)
- created_at (DATETIME)

### Таблица measurements

- id (INTEGER PRIMARY KEY)
- sensor_id (INTEGER)
- zone_number (INTEGER)
- temperature (REAL)
- humidity (REAL)
- timestamp (DATETIME)

### Таблица statuses

- id (INTEGER PRIMARY KEY)
- sensor_id (INTEGER)
- zone_number (INTEGER)
- status (INTEGER)
- timestamp (DATETIME)

## Логирование

Логи сохраняются в директории `logs/`:

- `error.log` - только ошибки
- `combined.log` - все логи
