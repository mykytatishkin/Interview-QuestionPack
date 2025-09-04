# CTE (Common Table Expression) в MS SQL Server - Теория

## 1. Что такое CTE?

**CTE (Common Table Expression)** - это временный именованный результат запроса, который существует только в рамках выполнения одного SQL-запроса. CTE можно рассматривать как временную таблицу, которая создается и используется в одном запросе.

### Преимущества CTE:
- **Читаемость** - улучшает читаемость сложных запросов
- **Переиспользование** - можно ссылаться на CTE несколько раз в запросе
- **Рекурсия** - поддержка рекурсивных запросов
- **Производительность** - оптимизация выполнения запросов

## 2. Базовый синтаксис CTE

### Простой CTE:
```sql
-- Базовый синтаксис
WITH CTE_Name AS
(
    SELECT column1, column2
    FROM table_name
    WHERE condition
)
SELECT * FROM CTE_Name;
```

### Пример с данными о заказах:
```sql
-- CTE для получения статистики по заказам
WITH OrderStats AS
(
    SELECT 
        CustomerID,
        COUNT(*) AS OrderCount,
        SUM(TotalAmount) AS TotalAmount,
        AVG(TotalAmount) AS AverageAmount
    FROM Orders
    WHERE OrderDate >= '2023-01-01'
    GROUP BY CustomerID
)
SELECT 
    c.CompanyName,
    os.OrderCount,
    os.TotalAmount,
    os.AverageAmount
FROM Customers c
INNER JOIN OrderStats os ON c.CustomerID = os.CustomerID
WHERE os.OrderCount > 5
ORDER BY os.TotalAmount DESC;
```

## 3. Множественные CTE

### Несколько CTE в одном запросе:
```sql
-- Множественные CTE
WITH 
-- CTE 1: Статистика по заказам
OrderStats AS
(
    SELECT 
        CustomerID,
        COUNT(*) AS OrderCount,
        SUM(TotalAmount) AS TotalAmount
    FROM Orders
    GROUP BY CustomerID
),
-- CTE 2: Топ клиенты
TopCustomers AS
(
    SELECT 
        CustomerID,
        TotalAmount,
        ROW_NUMBER() OVER (ORDER BY TotalAmount DESC) AS Rank
    FROM OrderStats
    WHERE OrderCount >= 3
),
-- CTE 3: Детали клиентов
CustomerDetails AS
(
    SELECT 
        CustomerID,
        CompanyName,
        ContactName,
        Country
    FROM Customers
)
SELECT 
    cd.CompanyName,
    cd.ContactName,
    cd.Country,
    tc.TotalAmount,
    tc.Rank
FROM TopCustomers tc
INNER JOIN CustomerDetails cd ON tc.CustomerID = cd.CustomerID
WHERE tc.Rank <= 10
ORDER BY tc.Rank;
```

## 4. Рекурсивные CTE

### Синтаксис рекурсивного CTE:
```sql
WITH RecursiveCTE AS
(
    -- Базовый случай (anchor member)
    SELECT columns
    FROM table
    WHERE base_condition
    
    UNION ALL
    
    -- Рекурсивный случай (recursive member)
    SELECT columns
    FROM table t
    INNER JOIN RecursiveCTE r ON t.parent_id = r.id
    WHERE recursive_condition
)
SELECT * FROM RecursiveCTE;
```

### Пример: Иерархия сотрудников:
```sql
-- Таблица сотрудников
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    ManagerID INT,
    Position NVARCHAR(100)
);

-- Рекурсивный CTE для иерархии
WITH EmployeeHierarchy AS
(
    -- Базовый случай: топ-менеджеры (без начальника)
    SELECT 
        EmployeeID,
        FirstName,
        LastName,
        ManagerID,
        Position,
        0 AS Level,
        CAST(FirstName + ' ' + LastName AS NVARCHAR(500)) AS HierarchyPath
    FROM Employees
    WHERE ManagerID IS NULL
    
    UNION ALL
    
    -- Рекурсивный случай: подчиненные
    SELECT 
        e.EmployeeID,
        e.FirstName,
        e.LastName,
        e.ManagerID,
        e.Position,
        eh.Level + 1,
        CAST(eh.HierarchyPath + ' -> ' + e.FirstName + ' ' + e.LastName AS NVARCHAR(500))
    FROM Employees e
    INNER JOIN EmployeeHierarchy eh ON e.ManagerID = eh.EmployeeID
)
SELECT 
    EmployeeID,
    FirstName,
    LastName,
    Position,
    Level,
    HierarchyPath
FROM EmployeeHierarchy
ORDER BY Level, FirstName;
```

### Пример: Категории товаров с подкатегориями:
```sql
-- Рекурсивный CTE для категорий
WITH CategoryHierarchy AS
(
    -- Базовый случай: корневые категории
    SELECT 
        CategoryID,
        CategoryName,
        ParentCategoryID,
        0 AS Level,
        CAST(CategoryName AS NVARCHAR(500)) AS FullPath
    FROM Categories
    WHERE ParentCategoryID IS NULL
    
    UNION ALL
    
    -- Рекурсивный случай: подкатегории
    SELECT 
        c.CategoryID,
        c.CategoryName,
        c.ParentCategoryID,
        ch.Level + 1,
        CAST(ch.FullPath + ' > ' + c.CategoryName AS NVARCHAR(500))
    FROM Categories c
    INNER JOIN CategoryHierarchy ch ON c.ParentCategoryID = ch.CategoryID
)
SELECT 
    CategoryID,
    CategoryName,
    Level,
    FullPath
FROM CategoryHierarchy
ORDER BY Level, CategoryName;
```

## 5. CTE для оконных функций

### Использование CTE с оконными функциями:
```sql
-- CTE с оконными функциями для ранжирования
WITH ProductRanking AS
(
    SELECT 
        ProductID,
        ProductName,
        CategoryID,
        UnitPrice,
        ROW_NUMBER() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS PriceRank,
        RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS PriceRankWithTies,
        DENSE_RANK() OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS DenseRank,
        LAG(UnitPrice, 1) OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS PreviousPrice,
        LEAD(UnitPrice, 1) OVER (PARTITION BY CategoryID ORDER BY UnitPrice DESC) AS NextPrice
    FROM Products
)
SELECT 
    ProductName,
    CategoryID,
    UnitPrice,
    PriceRank,
    PriceRankWithTies,
    DenseRank,
    PreviousPrice,
    NextPrice,
    UnitPrice - ISNULL(PreviousPrice, 0) AS PriceDifference
FROM ProductRanking
WHERE PriceRank <= 3
ORDER BY CategoryID, PriceRank;
```

## 6. CTE для агрегации

### Многоуровневая агрегация:
```sql
-- CTE для многоуровневой агрегации
WITH 
-- Уровень 1: Детали заказов
OrderDetails AS
(
    SELECT 
        o.OrderID,
        o.CustomerID,
        o.OrderDate,
        od.ProductID,
        od.Quantity,
        od.UnitPrice,
        od.Quantity * od.UnitPrice AS LineTotal
    FROM Orders o
    INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
),
-- Уровень 2: Агрегация по заказам
OrderTotals AS
(
    SELECT 
        OrderID,
        CustomerID,
        OrderDate,
        SUM(LineTotal) AS OrderTotal,
        COUNT(*) AS ItemCount
    FROM OrderDetails
    GROUP BY OrderID, CustomerID, OrderDate
),
-- Уровень 3: Агрегация по клиентам
CustomerTotals AS
(
    SELECT 
        CustomerID,
        COUNT(*) AS OrderCount,
        SUM(OrderTotal) AS TotalSpent,
        AVG(OrderTotal) AS AverageOrderValue,
        MIN(OrderDate) AS FirstOrderDate,
        MAX(OrderDate) AS LastOrderDate
    FROM OrderTotals
    GROUP BY CustomerID
)
SELECT 
    c.CompanyName,
    ct.OrderCount,
    ct.TotalSpent,
    ct.AverageOrderValue,
    ct.FirstOrderDate,
    ct.LastOrderDate
FROM CustomerTotals ct
INNER JOIN Customers c ON ct.CustomerID = c.CustomerID
WHERE ct.OrderCount >= 5
ORDER BY ct.TotalSpent DESC;
```

## 7. CTE для анализа временных рядов

### Анализ трендов продаж:
```sql
-- CTE для анализа временных рядов
WITH 
-- Группировка по месяцам
MonthlySales AS
(
    SELECT 
        YEAR(OrderDate) AS OrderYear,
        MONTH(OrderDate) AS OrderMonth,
        SUM(TotalAmount) AS MonthlyTotal,
        COUNT(*) AS OrderCount
    FROM Orders
    WHERE OrderDate >= '2022-01-01'
    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
),
-- Расчет скользящих средних
SalesWithMovingAverage AS
(
    SELECT 
        OrderYear,
        OrderMonth,
        MonthlyTotal,
        OrderCount,
        AVG(MonthlyTotal) OVER (
            ORDER BY OrderYear, OrderMonth 
            ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ) AS MovingAverage3Months,
        LAG(MonthlyTotal, 1) OVER (ORDER BY OrderYear, OrderMonth) AS PreviousMonth,
        LAG(MonthlyTotal, 12) OVER (ORDER BY OrderYear, OrderMonth) AS SameMonthLastYear
    FROM MonthlySales
)
SELECT 
    OrderYear,
    OrderMonth,
    MonthlyTotal,
    MovingAverage3Months,
    PreviousMonth,
    SameMonthLastYear,
    CASE 
        WHEN PreviousMonth IS NOT NULL 
        THEN ((MonthlyTotal - PreviousMonth) / PreviousMonth) * 100 
        ELSE NULL 
    END AS MonthOverMonthGrowth,
    CASE 
        WHEN SameMonthLastYear IS NOT NULL 
        THEN ((MonthlyTotal - SameMonthLastYear) / SameMonthLastYear) * 100 
        ELSE NULL 
    END AS YearOverYearGrowth
FROM SalesWithMovingAverage
ORDER BY OrderYear, OrderMonth;
```

## 8. CTE для удаления дубликатов

### Удаление дубликатов с помощью CTE:
```sql
-- CTE для удаления дубликатов
WITH DuplicateProducts AS
(
    SELECT 
        ProductID,
        ProductName,
        CategoryID,
        UnitPrice,
        ROW_NUMBER() OVER (
            PARTITION BY ProductName, CategoryID 
            ORDER BY ProductID
        ) AS RowNum
    FROM Products
)
-- Удаление дубликатов (оставляем только первую запись)
DELETE FROM DuplicateProducts
WHERE RowNum > 1;

-- Или выборка без дубликатов
WITH UniqueProducts AS
(
    SELECT 
        ProductID,
        ProductName,
        CategoryID,
        UnitPrice,
        ROW_NUMBER() OVER (
            PARTITION BY ProductName, CategoryID 
            ORDER BY ProductID
        ) AS RowNum
    FROM Products
)
SELECT 
    ProductID,
    ProductName,
    CategoryID,
    UnitPrice
FROM UniqueProducts
WHERE RowNum = 1;
```

## 9. CTE для pivot операций

### Преобразование строк в столбцы:
```sql
-- CTE для pivot операций
WITH SalesByCategory AS
(
    SELECT 
        YEAR(OrderDate) AS OrderYear,
        c.CategoryName,
        SUM(od.Quantity * od.UnitPrice) AS TotalSales
    FROM Orders o
    INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
    INNER JOIN Products p ON od.ProductID = p.ProductID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE OrderDate >= '2022-01-01'
    GROUP BY YEAR(OrderDate), c.CategoryName
),
-- Pivot данные
PivotedSales AS
(
    SELECT 
        OrderYear,
        [Beverages],
        [Condiments],
        [Confections],
        [Dairy Products],
        [Grains/Cereals],
        [Meat/Poultry],
        [Produce],
        [Seafood]
    FROM SalesByCategory
    PIVOT (
        SUM(TotalSales)
        FOR CategoryName IN (
            [Beverages], [Condiments], [Confections], 
            [Dairy Products], [Grains/Cereals], [Meat/Poultry], 
            [Produce], [Seafood]
        )
    ) AS PivotTable
)
SELECT * FROM PivotedSales
ORDER BY OrderYear;
```

## 10. Производительность CTE

### Оптимизация CTE:
```sql
-- Плохо: CTE без индексов
WITH ExpensiveCTE AS
(
    SELECT 
        CustomerID,
        COUNT(*) AS OrderCount
    FROM Orders
    WHERE OrderDate >= '2020-01-01'
    GROUP BY CustomerID
)
SELECT * FROM ExpensiveCTE;

-- Хорошо: CTE с фильтрацией
WITH OptimizedCTE AS
(
    SELECT 
        CustomerID,
        COUNT(*) AS OrderCount
    FROM Orders
    WHERE OrderDate >= '2023-01-01' -- Более узкий диапазон
    GROUP BY CustomerID
    HAVING COUNT(*) > 10 -- Фильтрация в CTE
)
SELECT * FROM OptimizedCTE;
```

### Рекомендации по производительности:
- **Используйте индексы** на столбцы в WHERE и JOIN условиях
- **Фильтруйте данные** в CTE, а не в основном запросе
- **Ограничивайте размер** CTE с помощью WHERE условий
- **Избегайте сложных вычислений** в CTE
- **Используйте EXISTS** вместо IN для больших наборов данных

## Практические задания:

1. **Создайте рекурсивный CTE** для построения иерархии категорий
2. **Используйте CTE** для расчета скользящих средних продаж
3. **Реализуйте CTE** для удаления дубликатов в таблице
4. **Создайте CTE** для анализа трендов временных рядов

## Ключевые моменты для собеседования:

- Понимание синтаксиса и назначения CTE
- Умение создавать рекурсивные CTE
- Знание преимуществ CTE перед подзапросами
- Понимание влияния CTE на производительность
- Умение использовать CTE для сложной аналитики
