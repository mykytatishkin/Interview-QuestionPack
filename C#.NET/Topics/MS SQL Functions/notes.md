---
title: MS SQL Functions — Функции в MS SQL Server
category: MS SQL
---

# MS SQL Functions — Функции в MS SQL Server

**Навигация:** [[../README|← Topics]]

---

## 1. Типы функций в SQL Server

### Scalar Functions (Скалярные функции):
- Возвращают одно значение
- Могут использоваться в SELECT, WHERE, ORDER BY
- Не могут изменять данные

### Table-Valued Functions (Табличные функции):
- Возвращают таблицу
- Могут использоваться в FROM clause
- Не могут изменять данные

### Aggregate Functions (Агрегатные функции):
- COUNT, SUM, AVG, MIN, MAX
- Работают с группами данных

## 2. Scalar Functions

### Создание скалярной функции:
```sql
-- Функция для расчета скидки
CREATE FUNCTION dbo.CalculateDiscount
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

-- Использование функции
SELECT 
    ProductName,
    UnitPrice,
    dbo.CalculateDiscount(UnitPrice, 10) AS PriceWithDiscount
FROM Products;
```

### Функция для форматирования даты:
```sql
CREATE FUNCTION dbo.FormatDate
(
    @Date DATETIME2,
    @Format NVARCHAR(20)
)
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @FormattedDate NVARCHAR(50);
    
    IF @Format = 'YYYY-MM-DD'
        SET @FormattedDate = FORMAT(@Date, 'yyyy-MM-dd');
    ELSE IF @Format = 'DD/MM/YYYY'
        SET @FormattedDate = FORMAT(@Date, 'dd/MM/yyyy');
    ELSE IF @Format = 'MMM DD, YYYY'
        SET @FormattedDate = FORMAT(@Date, 'MMM dd, yyyy');
    ELSE
        SET @FormattedDate = CAST(@Date AS NVARCHAR(50));
    
    RETURN @FormattedDate;
END;

-- Использование
SELECT 
    OrderID,
    dbo.FormatDate(OrderDate, 'DD/MM/YYYY') AS FormattedDate
FROM Orders;
```

### Функция для валидации email:
```sql
CREATE FUNCTION dbo.IsValidEmail
(
    @Email NVARCHAR(255)
)
RETURNS BIT
AS
BEGIN
    DECLARE @IsValid BIT = 0;
    
    IF @Email LIKE '%_@_%._%' 
       AND @Email NOT LIKE '%@%@%'
       AND @Email NOT LIKE '%..%'
       AND @Email NOT LIKE '%@.'
       AND @Email NOT LIKE '%.@'
       AND LEN(@Email) > 5
    BEGIN
        SET @IsValid = 1;
    END
    
    RETURN @IsValid;
END;

-- Использование
SELECT 
    UserID,
    Email,
    dbo.IsValidEmail(Email) AS IsValid
FROM Users;
```

## 3. Table-Valued Functions

### Inline Table-Valued Function:
```sql
-- Функция для получения товаров по категории
CREATE FUNCTION dbo.GetProductsByCategory
(
    @CategoryID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        ProductID,
        ProductName,
        UnitPrice,
        UnitsInStock
    FROM Products
    WHERE CategoryID = @CategoryID
);

-- Использование
SELECT * FROM dbo.GetProductsByCategory(1);

-- В JOIN
SELECT 
    c.CategoryName,
    p.ProductName,
    p.UnitPrice
FROM Categories c
INNER JOIN dbo.GetProductsByCategory(c.CategoryID) p ON 1=1;
```

### Multi-Statement Table-Valued Function:
```sql
-- Функция для получения статистики по заказам
CREATE FUNCTION dbo.GetOrderStatistics
(
    @StartDate DATETIME2,
    @EndDate DATETIME2
)
RETURNS @Statistics TABLE
(
    CustomerID INT,
    CustomerName NVARCHAR(100),
    OrderCount INT,
    TotalAmount DECIMAL(18,2),
    AverageAmount DECIMAL(18,2)
)
AS
BEGIN
    INSERT INTO @Statistics
    SELECT 
        c.CustomerID,
        c.CompanyName,
        COUNT(o.OrderID) AS OrderCount,
        SUM(o.TotalAmount) AS TotalAmount,
        AVG(o.TotalAmount) AS AverageAmount
    FROM Customers c
    INNER JOIN Orders o ON c.CustomerID = o.CustomerID
    WHERE o.OrderDate BETWEEN @StartDate AND @EndDate
    GROUP BY c.CustomerID, c.CompanyName;
    
    RETURN;
END;

-- Использование
SELECT * FROM dbo.GetOrderStatistics('2023-01-01', '2023-12-31');
```

## 4. Рекурсивные функции

### Рекурсивная функция для иерархии:
```sql
-- Функция для получения всех подчиненных сотрудников
CREATE FUNCTION dbo.GetSubordinates
(
    @ManagerID INT
)
RETURNS TABLE
AS
RETURN
(
    WITH EmployeeHierarchy AS
    (
        -- Базовый случай: непосредственные подчиненные
        SELECT 
            EmployeeID,
            FirstName,
            LastName,
            ManagerID,
            1 AS Level
        FROM Employees
        WHERE ManagerID = @ManagerID
        
        UNION ALL
        
        -- Рекурсивный случай: подчиненные подчиненных
        SELECT 
            e.EmployeeID,
            e.FirstName,
            e.LastName,
            e.ManagerID,
            eh.Level + 1
        FROM Employees e
        INNER JOIN EmployeeHierarchy eh ON e.ManagerID = eh.EmployeeID
    )
    SELECT 
        EmployeeID,
        FirstName,
        LastName,
        ManagerID,
        Level
    FROM EmployeeHierarchy
);

-- Использование
SELECT * FROM dbo.GetSubordinates(1);
```

## 5. Функции для работы с JSON

### Функция для парсинга JSON:
```sql
CREATE FUNCTION dbo.ParseProductJSON
(
    @JsonData NVARCHAR(MAX)
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        JSON_VALUE(@JsonData, '$.ProductID') AS ProductID,
        JSON_VALUE(@JsonData, '$.ProductName') AS ProductName,
        JSON_VALUE(@JsonData, '$.CategoryID') AS CategoryID,
        JSON_VALUE(@JsonData, '$.UnitPrice') AS UnitPrice,
        JSON_VALUE(@JsonData, '$.UnitsInStock') AS UnitsInStock
);

-- Использование
DECLARE @Json NVARCHAR(MAX) = '{"ProductID":1,"ProductName":"Laptop","CategoryID":1,"UnitPrice":999.99,"UnitsInStock":10}';
SELECT * FROM dbo.ParseProductJSON(@Json);
```

## 6. Функции для работы с датами

### Функция для расчета возраста:
```sql
CREATE FUNCTION dbo.CalculateAge
(
    @BirthDate DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @Age INT;
    
    SET @Age = DATEDIFF(YEAR, @BirthDate, GETDATE());
    
    -- Корректировка если день рождения еще не наступил
    IF DATEADD(YEAR, @Age, @BirthDate) > GETDATE()
        SET @Age = @Age - 1;
    
    RETURN @Age;
END;

-- Использование
SELECT 
    FirstName,
    LastName,
    BirthDate,
    dbo.CalculateAge(BirthDate) AS Age
FROM Employees;
```

### Функция для получения рабочих дней:
```sql
CREATE FUNCTION dbo.GetWorkingDays
(
    @StartDate DATE,
    @EndDate DATE
)
RETURNS INT
AS
BEGIN
    DECLARE @WorkingDays INT = 0;
    DECLARE @CurrentDate DATE = @StartDate;
    
    WHILE @CurrentDate <= @EndDate
    BEGIN
        -- Проверка на рабочий день (понедельник-пятница)
        IF DATEPART(WEEKDAY, @CurrentDate) BETWEEN 2 AND 6
        BEGIN
            SET @WorkingDays = @WorkingDays + 1;
        END
        
        SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
    END
    
    RETURN @WorkingDays;
END;

-- Использование
SELECT 
    OrderID,
    OrderDate,
    RequiredDate,
    dbo.GetWorkingDays(OrderDate, RequiredDate) AS WorkingDays
FROM Orders;
```

## 7. Функции для работы со строками

### Функция для поиска подстроки:
```sql
CREATE FUNCTION dbo.FindSubstring
(
    @MainString NVARCHAR(MAX),
    @SubString NVARCHAR(MAX)
)
RETURNS INT
AS
BEGIN
    DECLARE @Position INT;
    
    SET @Position = CHARINDEX(@SubString, @MainString);
    
    RETURN @Position;
END;

-- Использование
SELECT 
    ProductName,
    dbo.FindSubstring(ProductName, 'Laptop') AS LaptopPosition
FROM Products
WHERE dbo.FindSubstring(ProductName, 'Laptop') > 0;
```

### Функция для очистки строки:
```sql
CREATE FUNCTION dbo.CleanString
(
    @InputString NVARCHAR(MAX)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @CleanString NVARCHAR(MAX);
    
    -- Удаление лишних пробелов
    SET @CleanString = LTRIM(RTRIM(@InputString));
    
    -- Замена множественных пробелов на один
    WHILE CHARINDEX('  ', @CleanString) > 0
    BEGIN
        SET @CleanString = REPLACE(@CleanString, '  ', ' ');
    END
    
    -- Удаление специальных символов
    SET @CleanString = REPLACE(@CleanString, CHAR(9), ''); -- Tab
    SET @CleanString = REPLACE(@CleanString, CHAR(10), ''); -- Line feed
    SET @CleanString = REPLACE(@CleanString, CHAR(13), ''); -- Carriage return
    
    RETURN @CleanString;
END;

-- Использование
SELECT 
    ProductName,
    dbo.CleanString(ProductName) AS CleanProductName
FROM Products;
```

## 8. Функции для бизнес-логики

### Функция для расчета налога:
```sql
CREATE FUNCTION dbo.CalculateTax
(
    @Amount DECIMAL(18,2),
    @TaxRate DECIMAL(5,2),
    @TaxType NVARCHAR(20)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @TaxAmount DECIMAL(18,2);
    
    IF @TaxType = 'VAT'
        SET @TaxAmount = @Amount * (@TaxRate / 100);
    ELSE IF @TaxType = 'SALES'
        SET @TaxAmount = @Amount * (@TaxRate / 100);
    ELSE
        SET @TaxAmount = 0;
    
    RETURN @TaxAmount;
END;

-- Использование
SELECT 
    OrderID,
    TotalAmount,
    dbo.CalculateTax(TotalAmount, 20, 'VAT') AS TaxAmount,
    TotalAmount + dbo.CalculateTax(TotalAmount, 20, 'VAT') AS TotalWithTax
FROM Orders;
```

### Функция для определения статуса заказа:
```sql
CREATE FUNCTION dbo.GetOrderStatus
(
    @OrderDate DATETIME2,
    @ShippedDate DATETIME2,
    @RequiredDate DATETIME2
)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @Status NVARCHAR(20);
    
    IF @ShippedDate IS NOT NULL
        SET @Status = 'Shipped';
    ELSE IF @OrderDate IS NOT NULL AND @ShippedDate IS NULL
    BEGIN
        IF @RequiredDate < GETDATE()
            SET @Status = 'Overdue';
        ELSE
            SET @Status = 'Processing';
    END
    ELSE
        SET @Status = 'Pending';
    
    RETURN @Status;
END;

-- Использование
SELECT 
    OrderID,
    OrderDate,
    ShippedDate,
    RequiredDate,
    dbo.GetOrderStatus(OrderDate, ShippedDate, RequiredDate) AS OrderStatus
FROM Orders;
```

## 9. Управление функциями

### Изменение функции:
```sql
-- Изменение существующей функции
ALTER FUNCTION dbo.CalculateDiscount
(
    @Price DECIMAL(18,2),
    @DiscountPercent DECIMAL(5,2),
    @MinDiscount DECIMAL(18,2) = 0 -- Новый параметр
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @DiscountAmount DECIMAL(18,2);
    SET @DiscountAmount = @Price * (@DiscountPercent / 100);
    
    -- Применение минимальной скидки
    IF @DiscountAmount < @MinDiscount
        SET @DiscountAmount = @MinDiscount;
    
    RETURN @Price - @DiscountAmount;
END;
```

### Удаление функции:
```sql
-- Удаление функции
DROP FUNCTION dbo.CalculateDiscount;

-- Удаление с проверкой существования
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CalculateDiscount') AND type in (N'FN', N'IF', N'TF'))
    DROP FUNCTION dbo.CalculateDiscount;
```

### Просмотр информации о функциях:
```sql
-- Просмотр всех функций
SELECT 
    name AS FunctionName,
    type_desc AS FunctionType,
    create_date AS CreatedDate,
    modify_date AS ModifiedDate
FROM sys.objects
WHERE type IN ('FN', 'IF', 'TF') -- Scalar, Inline Table-Valued, Table-Valued
ORDER BY name;

-- Просмотр определения функции
SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.CalculateDiscount')) AS FunctionDefinition;
```

## 10. Производительность функций

### Влияние на производительность:
```sql
-- Плохо: функция в WHERE (не может использовать индекс)
SELECT * FROM Orders 
WHERE dbo.CalculateTax(TotalAmount, 20, 'VAT') > 100;

-- Хорошо: вычисление в SELECT
SELECT 
    OrderID,
    TotalAmount,
    dbo.CalculateTax(TotalAmount, 20, 'VAT') AS TaxAmount
FROM Orders
WHERE TotalAmount > 500; -- Использует индекс

-- Плохо: скалярная функция в большом запросе
SELECT 
    OrderID,
    dbo.FormatDate(OrderDate, 'DD/MM/YYYY') AS FormattedDate
FROM Orders; -- Вызывается для каждой строки

-- Хорошо: встроенная функция
SELECT 
    OrderID,
    FORMAT(OrderDate, 'dd/MM/yyyy') AS FormattedDate
FROM Orders;
```

### Рекомендации по производительности:
- Избегайте функций в WHERE и JOIN условиях
- Используйте встроенные функции вместо пользовательских когда возможно
- Применяйте table-valued functions для сложной логики
- Кэшируйте результаты часто используемых вычислений

## Практические задания:

1. **Создайте функцию** для расчета скидки с учетом категории товара
2. **Реализуйте функцию** для получения иерархии сотрудников
3. **Создайте функцию** для валидации и форматирования данных
4. **Оптимизируйте производительность** функций в запросах

## Ключевые моменты для собеседования:

---

## 🔗 Навигация

← [[../README|Вернуться к списку тем]]

---

## 📖 Рекомендуемый порядок

1. Изучи теорию выше
2. Пройди [[quick_check|быстрый опросник]]
3. Вернись к [[../README|списку тем]] для выбора следующей темы
