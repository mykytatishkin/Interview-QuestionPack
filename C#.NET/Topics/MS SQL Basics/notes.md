---
title: MS SQL Basics — Основы MS SQL Server
category: MS SQL
---

# MS SQL Basics — Основы MS SQL Server

**Навигация:** [[../Index|← Topics]]

---

## 1. Введение в SQL Server

### Что такое SQL Server?
**Microsoft SQL Server** - это система управления реляционными базами данных (RDBMS), разработанная Microsoft для корпоративных приложений.

### Основные компоненты:
- **Database Engine** - основной движок БД
- **Analysis Services** - аналитические службы
- **Integration Services** - службы интеграции
- **Reporting Services** - службы отчетности
- **Management Studio** - среда управления

## 2. Типы команд SQL

### DDL (Data Definition Language) - Язык определения данных
```sql
-- Создание базы данных
CREATE DATABASE MyDatabase;

-- Создание таблицы
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- Создание индекса
CREATE INDEX IX_Users_Email ON Users(Email);

-- Создание представления
CREATE VIEW vw_ActiveUsers AS
SELECT UserID, Username, Email, CreatedDate
FROM Users
WHERE IsActive = 1;

-- Создание хранимой процедуры
CREATE PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SELECT UserID, Username, Email, CreatedDate, IsActive
    FROM Users
    WHERE UserID = @UserId;
END;
```

### DML (Data Manipulation Language) - Язык манипуляции данными
```sql
-- Вставка данных
INSERT INTO Users (Username, Email)
VALUES ('john_doe', 'john@example.com');

-- Вставка нескольких строк
INSERT INTO Users (Username, Email)
VALUES 
    ('jane_smith', 'jane@example.com'),
    ('bob_wilson', 'bob@example.com');

-- Обновление данных
UPDATE Users 
SET Email = 'newemail@example.com'
WHERE Username = 'john_doe';

-- Удаление данных
DELETE FROM Users 
WHERE Username = 'bob_wilson';

-- Удаление всех данных (осторожно!)
-- DELETE FROM Users;
```

### DCL (Data Control Language) - Язык управления данными
```sql
-- Предоставление прав
GRANT SELECT, INSERT, UPDATE ON Users TO UserRole;

-- Отзыв прав
REVOKE DELETE ON Users FROM UserRole;

-- Создание роли
CREATE ROLE UserRole;

-- Добавление пользователя в роль
EXEC sp_addrolemember 'UserRole', 'username';
```

### TCL (Transaction Control Language) - Язык управления транзакциями
```sql
-- Начало транзакции
BEGIN TRANSACTION;

-- Выполнение операций
INSERT INTO Users (Username, Email) VALUES ('user1', 'user1@example.com');
UPDATE Users SET IsActive = 0 WHERE Username = 'john_doe';

-- Подтверждение транзакции
COMMIT TRANSACTION;

-- Или откат при ошибке
-- ROLLBACK TRANSACTION;
```

## 3. Основные типы данных

### Числовые типы:
```sql
-- Целые числа
TINYINT     -- 0 to 255
SMALLINT    -- -32,768 to 32,767
INT         -- -2,147,483,648 to 2,147,483,647
BIGINT      -- -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

-- Числа с плавающей точкой
FLOAT       -- 7 digits precision
REAL        -- 15 digits precision
DECIMAL     -- 38 digits precision
NUMERIC     -- 38 digits precision

-- Денежные типы
MONEY       -- -922,337,203,685,477.5808 to 922,337,203,685,477.5807
SMALLMONEY  -- -214,748.3648 to 214,748.3647
```

### Строковые типы:
```sql
-- Символьные строки
CHAR(n)         -- Фиксированная длина, до 8000 символов
VARCHAR(n)      -- Переменная длина, до 8000 символов
VARCHAR(MAX)    -- Переменная длина, до 2GB

-- Unicode строки
NCHAR(n)        -- Фиксированная длина Unicode, до 4000 символов
NVARCHAR(n)     -- Переменная длина Unicode, до 4000 символов
NVARCHAR(MAX)   -- Переменная длина Unicode, до 2GB

-- Текстовые типы
TEXT            -- Устаревший, до 2GB
NTEXT           -- Устаревший Unicode, до 2GB
```

### Дата и время:
```sql
-- Точные даты
DATETIME        -- 1753-01-01 to 9999-12-31, точность 3.33ms
DATETIME2       -- 0001-01-01 to 9999-12-31, точность 100ns
SMALLDATETIME   -- 1900-01-01 to 2079-06-06, точность 1min

-- Только дата
DATE            -- 0001-01-01 to 9999-12-31

-- Только время
TIME            -- 00:00:00.0000000 to 23:59:59.9999999

-- Временные метки
TIMESTAMP       -- Уникальная временная метка
```

### Другие типы:
```sql
-- Бинарные данные
BINARY(n)       -- Фиксированная длина, до 8000 байт
VARBINARY(n)    -- Переменная длина, до 8000 байт
VARBINARY(MAX)  -- Переменная длина, до 2GB
IMAGE            -- Устаревший, до 2GB

-- Логический тип
BIT              -- 0, 1, или NULL

-- Уникальные идентификаторы
UNIQUEIDENTIFIER -- 16-байтный GUID

-- XML
XML              -- XML данные
```

## 4. Создание и управление таблицами

### Создание таблицы с ограничениями:
```sql
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL CHECK (UnitPrice > 0),
    UnitsInStock INT NOT NULL DEFAULT 0 CHECK (UnitsInStock >= 0),
    Discontinued BIT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    
    -- Ограничения
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) 
        REFERENCES Categories(CategoryID),
    CONSTRAINT UQ_Products_ProductName UNIQUE (ProductName)
);
```

### Изменение структуры таблицы:
```sql
-- Добавление столбца
ALTER TABLE Products 
ADD Description NVARCHAR(500);

-- Изменение типа данных
ALTER TABLE Products 
ALTER COLUMN Description NVARCHAR(1000);

-- Удаление столбца
ALTER TABLE Products 
DROP COLUMN Description;

-- Добавление ограничения
ALTER TABLE Products 
ADD CONSTRAINT CK_Products_Price CHECK (UnitPrice > 0);

-- Удаление ограничения
ALTER TABLE Products 
DROP CONSTRAINT CK_Products_Price;
```

### Удаление таблицы:
```sql
-- Удаление таблицы
DROP TABLE Products;

-- Удаление с проверкой существования
IF OBJECT_ID('Products', 'U') IS NOT NULL
    DROP TABLE Products;
```

## 5. Индексы

### Типы индексов:
```sql
-- Кластерный индекс (только один на таблицу)
CREATE CLUSTERED INDEX IX_Products_CategoryID 
ON Products(CategoryID);

-- Некластерный индекс
CREATE NONCLUSTERED INDEX IX_Products_ProductName 
ON Products(ProductName);

-- Составной индекс
CREATE NONCLUSTERED INDEX IX_Products_Category_Price 
ON Products(CategoryID, UnitPrice);

-- Уникальный индекс
CREATE UNIQUE NONCLUSTERED INDEX IX_Products_ProductName 
ON Products(ProductName);

-- Индекс с включенными столбцами
CREATE NONCLUSTERED INDEX IX_Products_CategoryID_Include 
ON Products(CategoryID) 
INCLUDE (ProductName, UnitPrice);

-- Фильтрованный индекс
CREATE NONCLUSTERED INDEX IX_Products_Active 
ON Products(ProductID, ProductName) 
WHERE Discontinued = 0;
```

### Управление индексами:
```sql
-- Перестроение индекса
ALTER INDEX IX_Products_CategoryID ON Products REBUILD;

-- Реорганизация индекса
ALTER INDEX IX_Products_CategoryID ON Products REORGANIZE;

-- Удаление индекса
DROP INDEX IX_Products_CategoryID ON Products;

-- Просмотр информации об индексах
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('Products');
```

## 6. Запросы SELECT

### Базовые запросы:
```sql
-- Простой SELECT
SELECT ProductID, ProductName, UnitPrice
FROM Products;

-- SELECT с условием
SELECT ProductID, ProductName, UnitPrice
FROM Products
WHERE UnitPrice > 50;

-- SELECT с сортировкой
SELECT ProductID, ProductName, UnitPrice
FROM Products
WHERE UnitPrice > 50
ORDER BY UnitPrice DESC;

-- SELECT с ограничением количества строк
SELECT TOP 10 ProductID, ProductName, UnitPrice
FROM Products
ORDER BY UnitPrice DESC;
```

### JOIN операции:
```sql
-- INNER JOIN
SELECT p.ProductID, p.ProductName, c.CategoryName
FROM Products p
INNER JOIN Categories c ON p.CategoryID = c.CategoryID;

-- LEFT JOIN
SELECT p.ProductID, p.ProductName, c.CategoryName
FROM Products p
LEFT JOIN Categories c ON p.CategoryID = c.CategoryID;

-- RIGHT JOIN
SELECT p.ProductID, p.ProductName, c.CategoryName
FROM Products p
RIGHT JOIN Categories c ON p.CategoryID = c.CategoryID;

-- FULL JOIN
SELECT p.ProductID, p.ProductName, c.CategoryName
FROM Products p
FULL JOIN Categories c ON p.CategoryID = c.CategoryID;

-- CROSS JOIN
SELECT p.ProductName, c.CategoryName
FROM Products p
CROSS JOIN Categories c;
```

### Агрегатные функции:
```sql
-- Группировка и агрегация
SELECT 
    c.CategoryName,
    COUNT(p.ProductID) AS ProductCount,
    AVG(p.UnitPrice) AS AveragePrice,
    MIN(p.UnitPrice) AS MinPrice,
    MAX(p.UnitPrice) AS MaxPrice,
    SUM(p.UnitsInStock) AS TotalStock
FROM Products p
INNER JOIN Categories c ON p.CategoryID = c.CategoryID
GROUP BY c.CategoryName
HAVING COUNT(p.ProductID) > 5
ORDER BY ProductCount DESC;
```

### Подзапросы:
```sql
-- Подзапрос в WHERE
SELECT ProductID, ProductName, UnitPrice
FROM Products
WHERE UnitPrice > (SELECT AVG(UnitPrice) FROM Products);

-- Подзапрос в SELECT
SELECT 
    ProductID,
    ProductName,
    UnitPrice,
    (SELECT AVG(UnitPrice) FROM Products) AS AveragePrice,
    UnitPrice - (SELECT AVG(UnitPrice) FROM Products) AS PriceDifference
FROM Products;

-- Подзапрос в FROM
SELECT CategoryName, ProductCount
FROM (
    SELECT 
        c.CategoryName,
        COUNT(p.ProductID) AS ProductCount
    FROM Products p
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    GROUP BY c.CategoryName
) AS CategoryStats
WHERE ProductCount > 5;
```

## 7. Транзакции

### Основы транзакций:
```sql
-- Простая транзакция
BEGIN TRANSACTION;

BEGIN TRY
    -- Операции
    UPDATE Products SET UnitsInStock = UnitsInStock - 1 WHERE ProductID = 1;
    INSERT INTO OrderDetails (OrderID, ProductID, Quantity) VALUES (1, 1, 1);
    
    COMMIT TRANSACTION;
    PRINT 'Transaction committed successfully';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Transaction rolled back due to error: ' + ERROR_MESSAGE();
END CATCH;
```

### Уровни изоляции:
```sql
-- READ UNCOMMITTED (самый низкий уровень)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN TRANSACTION;
SELECT * FROM Products;
COMMIT;

-- READ COMMITTED (по умолчанию)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRANSACTION;
SELECT * FROM Products;
COMMIT;

-- REPEATABLE READ
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRANSACTION;
SELECT * FROM Products;
COMMIT;

-- SERIALIZABLE (самый высокий уровень)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRANSACTION;
SELECT * FROM Products;
COMMIT;

-- SNAPSHOT
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRANSACTION;
SELECT * FROM Products;
COMMIT;
```

## 8. Хранимые процедуры

### Создание и использование:
```sql
-- Простая хранимая процедура
CREATE PROCEDURE sp_GetProducts
    @CategoryID INT = NULL,
    @MinPrice DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ProductID, ProductName, UnitPrice, UnitsInStock
    FROM Products
    WHERE (@CategoryID IS NULL OR CategoryID = @CategoryID)
      AND UnitPrice >= @MinPrice
    ORDER BY ProductName;
END;

-- Вызов процедуры
EXEC sp_GetProducts;
EXEC sp_GetProducts @CategoryID = 1;
EXEC sp_GetProducts @CategoryID = 1, @MinPrice = 50;

-- Процедура с выходными параметрами
CREATE PROCEDURE sp_GetProductCount
    @CategoryID INT,
    @ProductCount INT OUTPUT
AS
BEGIN
    SELECT @ProductCount = COUNT(*)
    FROM Products
    WHERE CategoryID = @CategoryID;
END;

-- Вызов с выходным параметром
DECLARE @Count INT;
EXEC sp_GetProductCount @CategoryID = 1, @ProductCount = @Count OUTPUT;
PRINT 'Product count: ' + CAST(@Count AS VARCHAR);
```

## 9. Функции

### Типы функций:
```sql
-- Скалярная функция
CREATE FUNCTION fn_CalculateDiscount
(
    @Price DECIMAL(18,2),
    @DiscountPercent DECIMAL(5,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @DiscountAmount DECIMAL(18,2);
    SET @DiscountAmount = @Price * (@DiscountPercent / 100);
    RETURN @Price - @DiscountAmount;
END;

-- Использование скалярной функции
SELECT 
    ProductName,
    UnitPrice,
    dbo.fn_CalculateDiscount(UnitPrice, 10) AS PriceWithDiscount
FROM Products;

-- Табличная функция
CREATE FUNCTION fn_GetProductsByCategory
(
    @CategoryID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT ProductID, ProductName, UnitPrice
    FROM Products
    WHERE CategoryID = @CategoryID
);

-- Использование табличной функции
SELECT * FROM dbo.fn_GetProductsByCategory(1);
```

## 10. Триггеры

### Создание триггеров:
```sql
-- AFTER INSERT триггер
CREATE TRIGGER tr_Products_Insert
ON Products
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ProductAudit (ProductID, Action, ActionDate)
    SELECT ProductID, 'INSERT', GETDATE()
    FROM inserted;
END;

-- INSTEAD OF UPDATE триггер
CREATE TRIGGER tr_Products_Update
ON Products
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Проверка бизнес-правил
    IF EXISTS (SELECT 1 FROM inserted WHERE UnitPrice < 0)
    BEGIN
        RAISERROR('Price cannot be negative', 16, 1);
        RETURN;
    END;
    
    -- Выполнение обновления
    UPDATE p
    SET ProductName = i.ProductName,
        UnitPrice = i.UnitPrice,
        UnitsInStock = i.UnitsInStock
    FROM Products p
    INNER JOIN inserted i ON p.ProductID = i.ProductID;
    
    -- Логирование
    INSERT INTO ProductAudit (ProductID, Action, ActionDate)
    SELECT ProductID, 'UPDATE', GETDATE()
    FROM inserted;
END;
```

## Практические задания:

1. **Создайте базу данных** для интернет-магазина с таблицами Products, Categories, Orders, OrderDetails
2. **Напишите запросы** для получения популярных товаров, статистики продаж
3. **Создайте хранимые процедуры** для добавления товаров, оформления заказов
4. **Реализуйте триггеры** для автоматического обновления остатков товаров
5. **Создайте представления** для часто используемых запросов

## Ключевые моменты для собеседования:

- Понимание типов команд SQL (DDL, DML, DCL, TCL)
---

## 🔗 Навигация

← [[../Index|Вернуться к списку тем]]

---

## 📖 Рекомендуемый порядок

1. Изучи теорию выше
2. Пройди [[quick_check|быстрый опросник]]
3. Вернись к [[../Index|списку тем]] для выбора следующей темы
