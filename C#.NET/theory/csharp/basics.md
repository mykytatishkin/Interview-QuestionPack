# Основы C# - Теория

## 1. Структура программы

### Hello World
```csharp
using System;

namespace HelloWorld
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
```

### Основные элементы:
- **using** - импорт пространств имен
- **namespace** - логическая группировка кода
- **class** - шаблон для создания объектов
- **Main** - точка входа в программу

## 2. Типы данных

### Примитивные типы:
```csharp
// Целые числа
byte b = 255;           // 0-255
short s = 32767;        // -32,768 to 32,767
int i = 2147483647;     // -2,147,483,648 to 2,147,483,647
long l = 9223372036854775807L; // -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807

// Числа с плавающей точкой
float f = 3.14f;        // 7 digits precision
double d = 3.14159265359; // 15-16 digits precision
decimal dec = 3.14159265359m; // 28-29 digits precision

// Символы и строки
char c = 'A';           // Unicode character
string str = "Hello";   // Immutable string

// Логический тип
bool flag = true;       // true or false
```

### Nullable типы:
```csharp
int? nullableInt = null;        // Может быть null
string? nullableString = null;  // Nullable reference type (C# 8.0+)
```

## 3. Переменные и константы

### Объявление переменных:
```csharp
// Явное указание типа
int age = 25;
string name = "John";

// Вывод типа (var)
var salary = 50000.0;  // Компилятор определит тип как double
var isActive = true;    // bool

// Константы
const double PI = 3.14159;
const string APP_NAME = "MyApp";
```

### Область видимости:
```csharp
class Example
{
    private int privateField;    // Только внутри класса
    protected int protectedField; // Класс и наследники
    internal int internalField;   // Внутри сборки
    public int publicField;      // Везде
}
```

## 4. Операторы

### Арифметические:
```csharp
int a = 10, b = 3;
int sum = a + b;        // 13
int diff = a - b;       // 7
int product = a * b;    // 30
int quotient = a / b;   // 3
int remainder = a % b;  // 1
```

### Операторы сравнения:
```csharp
bool equal = (a == b);      // false
bool notEqual = (a != b);   // true
bool greater = (a > b);     // true
bool less = (a < b);        // false
bool greaterEqual = (a >= b); // true
bool lessEqual = (a <= b);    // false
```

### Логические операторы:
```csharp
bool x = true, y = false;
bool and = x && y;      // false (логическое И)
bool or = x || y;       // true (логическое ИЛИ)
bool not = !x;          // false (логическое НЕ)
```

## 5. Управляющие конструкции

### Условные операторы:
```csharp
// if-else
if (age >= 18)
{
    Console.WriteLine("Взрослый");
}
else if (age >= 12)
{
    Console.WriteLine("Подросток");
}
else
{
    Console.WriteLine("Ребенок");
}

// Тернарный оператор
string status = age >= 18 ? "Взрослый" : "Несовершеннолетний";

// switch expression (C# 8.0+)
string category = age switch
{
    < 12 => "Ребенок",
    < 18 => "Подросток",
    < 65 => "Взрослый",
    _ => "Пенсионер"
};
```

### Циклы:
```csharp
// for
for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);
}

// while
int j = 0;
while (j < 5)
{
    Console.WriteLine(j);
    j++;
}

// do-while
int k = 0;
do
{
    Console.WriteLine(k);
    k++;
} while (k < 5);

// foreach
string[] names = { "Alice", "Bob", "Charlie" };
foreach (string name in names)
{
    Console.WriteLine(name);
}
```

## 6. Массивы и коллекции

### Массивы:
```csharp
// Одномерный массив
int[] numbers = new int[5];
int[] initialized = { 1, 2, 3, 4, 5 };

// Многомерный массив
int[,] matrix = new int[3, 3];
int[,] matrix2 = { { 1, 2 }, { 3, 4 } };

// Массив массивов (jagged array)
int[][] jagged = new int[3][];
jagged[0] = new int[] { 1, 2, 3 };
jagged[1] = new int[] { 4, 5 };
jagged[2] = new int[] { 6 };
```

### Основные коллекции:
```csharp
// List<T> - динамический массив
List<string> names = new List<string>();
names.Add("Alice");
names.Add("Bob");

// Dictionary<K,V> - словарь
Dictionary<string, int> ages = new Dictionary<string, int>();
ages["Alice"] = 25;
ages["Bob"] = 30;

// HashSet<T> - множество уникальных элементов
HashSet<int> uniqueNumbers = new HashSet<int>();
uniqueNumbers.Add(1);
uniqueNumbers.Add(2);
uniqueNumbers.Add(1); // Не добавится
```

## 7. Методы

### Объявление методов:
```csharp
class Calculator
{
    // Простой метод
    public void SayHello()
    {
        Console.WriteLine("Hello!");
    }
    
    // Метод с параметрами
    public int Add(int a, int b)
    {
        return a + b;
    }
    
    // Метод с параметрами по умолчанию
    public int Multiply(int a, int b = 1)
    {
        return a * b;
    }
    
    // Метод с out параметром
    public bool TryDivide(int a, int b, out int result)
    {
        if (b == 0)
        {
            result = 0;
            return false;
        }
        result = a / b;
        return true;
    }
    
    // Метод с ref параметром
    public void Swap(ref int a, ref int b)
    {
        int temp = a;
        a = b;
        b = temp;
    }
}
```

### Перегрузка методов:
```csharp
public class MathOperations
{
    public int Add(int a, int b) => a + b;
    public double Add(double a, double b) => a + b;
    public int Add(int a, int b, int c) => a + b + c;
}
```

## 8. Обработка исключений

### try-catch-finally:
```csharp
try
{
    int result = 10 / 0; // Вызовет исключение
}
catch (DivideByZeroException ex)
{
    Console.WriteLine($"Ошибка деления на ноль: {ex.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"Общая ошибка: {ex.Message}");
}
finally
{
    Console.WriteLine("Этот блок выполнится всегда");
}
```

### Создание исключений:
```csharp
public void ValidateAge(int age)
{
    if (age < 0 || age > 150)
    {
        throw new ArgumentException("Возраст должен быть от 0 до 150", nameof(age));
    }
}
```

## 9. Пространства имен

### Организация кода:
```csharp
namespace MyCompany.MyProject
{
    namespace Models
    {
        public class User { }
    }
    
    namespace Services
    {
        public class UserService { }
    }
}

// Использование using
using MyCompany.MyProject.Models;
using MyCompany.MyProject.Services;
```

## 10. Атрибуты

### Встроенные атрибуты:
```csharp
[Obsolete("Используйте новый метод NewMethod")]
public void OldMethod() { }

[Serializable]
public class Person { }

[Conditional("DEBUG")]
public void DebugMethod() { }
```

### Создание атрибутов:
```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class CustomAttribute : Attribute
{
    public string Description { get; set; }
    
    public CustomAttribute(string description)
    {
        Description = description;
    }
}

[Custom("Это важный класс")]
public class ImportantClass { }
```

## Практические задания:

1. **Создайте класс Calculator** с методами для основных математических операций
2. **Реализуйте метод** для поиска максимального элемента в массиве
3. **Напишите программу** для подсчета слов в строке
4. **Создайте класс BankAccount** с методами для пополнения и снятия средств

## Ключевые моменты для собеседования:

- Понимание разницы между value types и reference types
- Умение работать с nullable типами
- Знание основных коллекций и их применения
- Понимание области видимости переменных
- Умение обрабатывать исключения
- Знание атрибутов и их применения
