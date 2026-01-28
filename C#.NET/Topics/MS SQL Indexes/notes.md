---
title: MS SQL Indexes — Индексы в MS SQL Server
category: MS SQL
---

# MS SQL Indexes — Индексы в MS SQL Server

**Навигация:** [[../Index|← Topics]]

---

## 1. Что такое индексы?

**Индекс** - это структура данных, которая ускоряет поиск и сортировку данных в таблице. Индекс создает упорядоченный список значений столбцов с указателями на соответствующие строки в таблице.

### Аналогия с книгой:
- **Таблица** = книга
- **Индекс** = оглавление книги
- **Данные** = страницы книги

## 2. Типы индексов

### Clustered Index (Кластерный индекс):
```sql
-- Создание кластерного индекса
CREATE CLUSTERED INDEX IX_Orders_OrderDate 
ON Orders(OrderDate);

-- Кластерный индекс определяет физический порядок данных
-- Только один кластерный индекс на таблицу
-- По умолчанию создается на PRIMARY KEY
```

### Non-Clustered Index (Некластерный индекс):
```sql
-- Создание некластерного индекса
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId 
ON Orders(CustomerId);

-- Некластерный индекс - отдельная структура
-- Может быть много некластерных индексов на таблицу
-- Содержит указатели на данные в кластерном индексе
```

### Unique Index (Уникальный индекс):
```sql
-- Создание уникального индекса
CREATE UNIQUE NONCLUSTERED INDEX IX_Users_Email 
ON Users(Email);

-- Обеспечивает уникальность значений
-- Автоматически создается для UNIQUE constraints
```

## 3. Составные индексы

### Создание составного индекса:
```sql
-- Составной индекс на несколько столбцов
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate 
ON Orders(CustomerId, OrderDate);

-- Порядок столбцов важен!
-- Первый столбец должен быть в WHERE условии
```

### Правила составных индексов:
```sql
-- Хорошо: CustomerId в WHERE
SELECT * FROM Orders WHERE CustomerId = 123;

-- Хорошо: CustomerId и OrderDate в WHERE
SELECT * FROM Orders WHERE CustomerId = 123 AND OrderDate > '2023-01-01';

-- Плохо: только OrderDate в WHERE (без CustomerId)
SELECT * FROM Orders WHERE OrderDate > '2023-01-01';

-- Хорошо: CustomerId в WHERE, OrderDate в ORDER BY
SELECT * FROM Orders WHERE CustomerId = 123 ORDER BY OrderDate;
```

## 4. Индексы с включенными столбцами

### INCLUDE индексы:
```sql
-- Индекс с включенными столбцами
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_Include 
ON Orders(CustomerId) 
INCLUDE (OrderDate, TotalAmount);

-- Включенные столбцы не участвуют в сортировке
-- Но доступны без обращения к основной таблице
-- Уменьшают количество key lookups
```

### Когда использовать INCLUDE:
```sql
-- Запрос, который выиграет от INCLUDE индекса
SELECT CustomerId, OrderDate, TotalAmount 
FROM Orders 
WHERE CustomerId = 123;

-- Без INCLUDE: Index Seek + Key Lookup
-- С INCLUDE: только Index Seek
```

## 5. Фильтрованные индексы

### Создание фильтрованного индекса:
```sql
-- Фильтрованный индекс только для активных заказов
CREATE NONCLUSTERED INDEX IX_Orders_Active_CustomerId 
ON Orders(CustomerId) 
WHERE Status = 'Active';

-- Индекс создается только для строк, удовлетворяющих условию
-- Меньший размер индекса
-- Быстрее обновление
```

### Примеры фильтрованных индексов:
```sql
-- Индекс для недавних заказов
CREATE NONCLUSTERED INDEX IX_Orders_Recent_OrderDate 
ON Orders(OrderDate) 
WHERE OrderDate >= '2023-01-01';

-- Индекс для дорогих заказов
CREATE NONCLUSTERED INDEX IX_Orders_Expensive_TotalAmount 
ON Orders(TotalAmount) 
WHERE TotalAmount > 1000;

-- Индекс для заказов с доставкой
CREATE NONCLUSTERED INDEX IX_Orders_WithDelivery_DeliveryDate 
ON Orders(DeliveryDate) 
WHERE DeliveryDate IS NOT NULL;
```

## 6. Анализ производительности

### Просмотр плана выполнения:
```sql
-- Включение плана выполнения
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Запрос для анализа
SELECT * FROM Orders 
WHERE CustomerId = 123 AND OrderDate > '2023-01-01';

-- Анализ результатов:
-- Table Scan - плохо (читает всю таблицу)
-- Index Seek - хорошо (использует индекс)
-- Index Scan - приемлемо (читает весь индекс)
-- Key Lookup - можно оптимизировать с INCLUDE
```

### Анализ использования индексов:
```sql
-- Просмотр статистики использования индексов
SELECT 
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates,
    s.last_user_seek,
    s.last_user_scan
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE i.object_id = OBJECT_ID('Orders')
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;
```

## 7. Оптимизация индексов

### Определение нужных индексов:
```sql
-- Анализ отсутствующих индексов
SELECT 
    migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) AS improvement_measure,
    'CREATE INDEX IX_' + OBJECT_NAME(mid.object_id) + '_' + 
    REPLACE(REPLACE(REPLACE(ISNULL(mid.equality_columns,''),', ','_'),'[',''),']','') +
    CASE WHEN mid.inequality_columns IS NOT NULL 
         THEN '_' + REPLACE(REPLACE(REPLACE(mid.inequality_columns,', ','_'),'[',''),']','')
         ELSE '' END AS create_index_statement,
    migs.*,
    mid.database_id,
    mid.object_id
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE migs.avg_total_user_cost * (migs.avg_user_impact / 100.0) * (migs.user_seeks + migs.user_scans) > 10
ORDER BY migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) DESC;
```

### Мониторинг фрагментации:
```sql
-- Проверка фрагментации индексов
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.index_type_desc,
    ips.avg_fragmentation_in_percent,
    ips.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

## 8. Управление индексами

### Перестроение индексов:
```sql
-- Перестроение индекса (создает новый)
ALTER INDEX IX_Orders_CustomerId ON Orders REBUILD;

-- Перестроение всех индексов таблицы
ALTER INDEX ALL ON Orders REBUILD;

-- Перестроение с параметрами
ALTER INDEX IX_Orders_CustomerId ON Orders REBUILD 
WITH (FILLFACTOR = 90, PAD_INDEX = ON);
```

### Реорганизация индексов:
```sql
-- Реорганизация индекса (дефрагментация)
ALTER INDEX IX_Orders_CustomerId ON Orders REORGANIZE;

-- Реорганизация всех индексов таблицы
ALTER INDEX ALL ON Orders REORGANIZE;
```

### Удаление индексов:
```sql
-- Удаление индекса
DROP INDEX IX_Orders_CustomerId ON Orders;

-- Удаление с проверкой существования
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CustomerId' AND object_id = OBJECT_ID('Orders'))
    DROP INDEX IX_Orders_CustomerId ON Orders;
```

## 9. Практические примеры

### Оптимизация таблицы Products:
```sql
-- Таблица Products
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    UnitsInStock INT NOT NULL,
    Discontinued BIT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT GETDATE()
);

-- Индексы для оптимизации запросов:

-- 1. Кластерный индекс на ProductID (автоматически создается)
-- PRIMARY KEY создает кластерный индекс

-- 2. Индекс для поиска по категории
CREATE NONCLUSTERED INDEX IX_Products_CategoryID 
ON Products(CategoryID);

-- 3. Индекс для поиска по цене
CREATE NONCLUSTERED INDEX IX_Products_UnitPrice 
ON Products(UnitPrice);

-- 4. Составной индекс для сложных запросов
CREATE NONCLUSTERED INDEX IX_Products_Category_Price 
ON Products(CategoryID, UnitPrice);

-- 5. Индекс с включенными столбцами
CREATE NONCLUSTERED INDEX IX_Products_CategoryID_Include 
ON Products(CategoryID) 
INCLUDE (ProductName, UnitPrice, UnitsInStock);

-- 6. Фильтрованный индекс для активных товаров
CREATE NONCLUSTERED INDEX IX_Products_Active_Price 
ON Products(UnitPrice) 
WHERE Discontinued = 0;

-- 7. Уникальный индекс для названия товара
CREATE UNIQUE NONCLUSTERED INDEX IX_Products_ProductName 
ON Products(ProductName);
```

### Оптимизация запросов:
```sql
-- Запрос 1: Поиск товаров по категории
SELECT ProductName, UnitPrice 
FROM Products 
WHERE CategoryID = 1;
-- Использует: IX_Products_CategoryID_Include

-- Запрос 2: Поиск дорогих товаров
SELECT ProductName, UnitPrice 
FROM Products 
WHERE UnitPrice > 100;
-- Использует: IX_Products_UnitPrice

-- Запрос 3: Сложный запрос
SELECT ProductName, UnitPrice 
FROM Products 
WHERE CategoryID = 1 AND UnitPrice > 50 
ORDER BY UnitPrice;
-- Использует: IX_Products_Category_Price

-- Запрос 4: Поиск активных товаров
SELECT ProductName, UnitPrice 
FROM Products 
WHERE Discontinued = 0 AND UnitPrice > 100;
-- Использует: IX_Products_Active_Price
```

## 10. Лучшие практики

### Рекомендации по созданию индексов:
```sql
-- 1. Создавайте индексы на часто используемые столбцы в WHERE
-- 2. Порядок столбцов в составном индексе важен
-- 3. Используйте INCLUDE для покрывающих индексов
-- 4. Применяйте фильтрованные индексы для подмножеств данных
-- 5. Мониторьте использование индексов
-- 6. Регулярно дефрагментируйте индексы
-- 7. Не создавайте слишком много индексов (замедляет INSERT/UPDATE)
```

### Анти-паттерны:
```sql
-- Плохо: Индекс на каждый столбец
CREATE INDEX IX_Products_ProductName ON Products(ProductName);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Products_UnitPrice ON Products(UnitPrice);
CREATE INDEX IX_Products_UnitsInStock ON Products(UnitsInStock);
-- Слишком много индексов замедляет обновления

-- Плохо: Составной индекс в неправильном порядке
CREATE INDEX IX_Products_Price_Category ON Products(UnitPrice, CategoryID);
-- Если запросы ищут по CategoryID, а не по UnitPrice

-- Плохо: Индекс на столбцы с низкой селективностью
CREATE INDEX IX_Products_Discontinued ON Products(Discontinued);
-- BIT столбец с 2 значениями не подходит для индекса
```

## Практические задания:

1. **Создайте индексы** для таблицы Orders с полями: OrderID, CustomerID, OrderDate, TotalAmount
2. **Оптимизируйте запросы** используя составные индексы
3. **Создайте фильтрованный индекс** для активных заказов
4. **Проанализируйте производительность** запросов с помощью плана выполнения

## Ключевые моменты для собеседования:

---

## 🔗 Навигация

← [[../Index|Вернуться к списку тем]]

---

## 📖 Рекомендуемый порядок

1. Изучи теорию выше
2. Пройди [[quick_check|быстрый опросник]]
3. Вернись к [[../Index|списку тем]] для выбора следующей темы
