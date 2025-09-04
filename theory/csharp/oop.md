# ООП в C# - Теория

## 1. Основные принципы ООП

### Инкапсуляция
**Инкапсуляция** - объединение данных и методов, которые работают с этими данными, в единый объект и скрытие внутренней реализации от внешнего мира.

```csharp
public class BankAccount
{
    // Приватные поля (скрыты от внешнего мира)
    private decimal balance;
    private string accountNumber;
    
    // Публичные свойства (контролируемый доступ)
    public decimal Balance 
    { 
        get { return balance; }
        private set { balance = value; } // Только внутри класса
    }
    
    public string AccountNumber 
    { 
        get { return accountNumber; }
        private set { accountNumber = value; }
    }
    
    // Конструктор
    public BankAccount(string accountNumber, decimal initialBalance)
    {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }
    
    // Публичные методы
    public void Deposit(decimal amount)
    {
        if (amount > 0)
        {
            balance += amount;
        }
    }
    
    public bool Withdraw(decimal amount)
    {
        if (amount > 0 && amount <= balance)
        {
            balance -= amount;
            return true;
        }
        return false;
    }
}
```

### Наследование
**Наследование** - механизм, позволяющий создавать новый класс на основе существующего, наследуя его свойства и методы.

```csharp
// Базовый класс
public class Animal
{
    public string Name { get; set; }
    public int Age { get; set; }
    
    public virtual void MakeSound()
    {
        Console.WriteLine("Some sound");
    }
    
    public virtual void Sleep()
    {
        Console.WriteLine($"{Name} is sleeping");
    }
}

// Производный класс
public class Dog : Animal
{
    public string Breed { get; set; }
    
    // Переопределение метода
    public override void MakeSound()
    {
        Console.WriteLine("Woof! Woof!");
    }
    
    // Новый метод
    public void Fetch()
    {
        Console.WriteLine($"{Name} is fetching the ball");
    }
}

// Множественное наследование через интерфейсы
public interface IFlyable
{
    void Fly();
}

public interface ISwimmable
{
    void Swim();
}

public class Duck : Animal, IFlyable, ISwimmable
{
    public override void MakeSound()
    {
        Console.WriteLine("Quack! Quack!");
    }
    
    public void Fly()
    {
        Console.WriteLine($"{Name} is flying");
    }
    
    public void Swim()
    {
        Console.WriteLine($"{Name} is swimming");
    }
}
```

### Полиморфизм
**Полиморфизм** - способность объектов с одинаковым интерфейсом иметь различную реализацию.

```csharp
public class Shape
{
    public virtual double CalculateArea()
    {
        return 0;
    }
}

public class Circle : Shape
{
    public double Radius { get; set; }
    
    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}

public class Rectangle : Shape
{
    public double Width { get; set; }
    public double Height { get; set; }
    
    public override double CalculateArea()
    {
        return Width * Height;
    }
}

// Использование полиморфизма
public class AreaCalculator
{
    public double CalculateTotalArea(Shape[] shapes)
    {
        double totalArea = 0;
        foreach (var shape in shapes)
        {
            totalArea += shape.CalculateArea(); // Полиморфный вызов
        }
        return totalArea;
    }
}

// Пример использования
var shapes = new Shape[]
{
    new Circle { Radius = 5 },
    new Rectangle { Width = 10, Height = 20 }
};

var calculator = new AreaCalculator();
double totalArea = calculator.CalculateTotalArea(shapes);
```

## 2. Абстрактные классы

**Абстрактный класс** - класс, который не может быть создан напрямую и может содержать абстрактные методы.

```csharp
public abstract class Vehicle
{
    public string Brand { get; set; }
    public string Model { get; set; }
    public int Year { get; set; }
    
    // Абстрактный метод - должен быть реализован в производных классах
    public abstract void StartEngine();
    
    // Виртуальный метод - может быть переопределен
    public virtual void StopEngine()
    {
        Console.WriteLine("Engine stopped");
    }
    
    // Обычный метод
    public void DisplayInfo()
    {
        Console.WriteLine($"Brand: {Brand}, Model: {Model}, Year: {Year}");
    }
}

public class Car : Vehicle
{
    public int Doors { get; set; }
    
    // Реализация абстрактного метода
    public override void StartEngine()
    {
        Console.WriteLine("Car engine started with key");
    }
    
    // Переопределение виртуального метода
    public override void StopEngine()
    {
        Console.WriteLine("Car engine stopped with key");
    }
}

public class Motorcycle : Vehicle
{
    public bool HasSidecar { get; set; }
    
    public override void StartEngine()
    {
        Console.WriteLine("Motorcycle engine started with button");
    }
}
```

## 3. Интерфейсы

**Интерфейс** - контракт, определяющий набор методов, которые должен реализовать класс.

```csharp
// Базовый интерфейс
public interface ILogger
{
    void Log(string message);
    void LogError(string error);
}

// Интерфейс для работы с файлами
public interface IFileOperations
{
    void SaveToFile(string content);
    string ReadFromFile();
}

// Интерфейс для валидации
public interface IValidatable
{
    bool IsValid();
    List<string> GetValidationErrors();
}

// Класс, реализующий несколько интерфейсов
public class FileLogger : ILogger, IFileOperations, IValidatable
{
    private string filePath;
    private List<string> validationErrors;
    
    public FileLogger(string filePath)
    {
        this.filePath = filePath;
        this.validationErrors = new List<string>();
    }
    
    public void Log(string message)
    {
        File.AppendAllText(filePath, $"{DateTime.Now}: {message}\n");
    }
    
    public void LogError(string error)
    {
        File.AppendAllText(filePath, $"{DateTime.Now}: ERROR - {error}\n");
    }
    
    public void SaveToFile(string content)
    {
        File.WriteAllText(filePath, content);
    }
    
    public string ReadFromFile()
    {
        return File.Exists(filePath) ? File.ReadAllText(filePath) : string.Empty;
    }
    
    public bool IsValid()
    {
        validationErrors.Clear();
        
        if (string.IsNullOrEmpty(filePath))
            validationErrors.Add("File path cannot be empty");
        
        if (!Path.IsPathRooted(filePath))
            validationErrors.Add("File path must be absolute");
        
        return validationErrors.Count == 0;
    }
    
    public List<string> GetValidationErrors()
    {
        return validationErrors;
    }
}
```

## 4. Конструкторы

### Типы конструкторов:
```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }
    
    // Конструктор по умолчанию
    public Person()
    {
        Name = "Unknown";
        Age = 0;
        Email = "";
    }
    
    // Параметризованный конструктор
    public Person(string name, int age)
    {
        Name = name;
        Age = age;
        Email = "";
    }
    
    // Конструктор с параметрами по умолчанию
    public Person(string name, int age = 18, string email = "")
    {
        Name = name;
        Age = age;
        Email = email;
    }
    
    // Статический конструктор
    static Person()
    {
        Console.WriteLine("Person class initialized");
    }
    
    // Приватный конструктор (для паттерна Singleton)
    private Person(string name)
    {
        Name = name;
    }
    
    // Статический метод для создания экземпляра
    public static Person CreateInstance(string name)
    {
        return new Person(name);
    }
}
```

## 5. Свойства и индексаторы

### Автоматические свойства:
```csharp
public class Product
{
    // Автоматические свойства
    public string Name { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    
    // Свойство только для чтения
    public string Id { get; } = Guid.NewGuid().ToString();
    
    // Свойство с логикой
    public decimal TotalValue => Price * Stock;
    
    // Свойство с валидацией
    private decimal _discount;
    public decimal Discount
    {
        get { return _discount; }
        set 
        { 
            if (value < 0 || value > 100)
                throw new ArgumentException("Discount must be between 0 and 100");
            _discount = value;
        }
    }
}
```

### Индексаторы:
```csharp
public class CustomCollection<T>
{
    private List<T> items = new List<T>();
    
    // Индексатор
    public T this[int index]
    {
        get
        {
            if (index < 0 || index >= items.Count)
                throw new IndexOutOfRangeException();
            return items[index];
        }
        set
        {
            if (index < 0 || index >= items.Count)
                throw new IndexOutOfRangeException();
            items[index] = value;
        }
    }
    
    // Индексатор с несколькими параметрами
    public T this[string key, int index]
    {
        get
        {
            // Логика поиска по ключу и индексу
            return items[index];
        }
    }
    
    public void Add(T item)
    {
        items.Add(item);
    }
    
    public int Count => items.Count;
}
```

## 6. Модификаторы доступа

```csharp
public class Example
{
    // private - доступ только внутри класса
    private string privateField = "private";
    
    // protected - доступ внутри класса и в наследниках
    protected string protectedField = "protected";
    
    // internal - доступ внутри сборки
    internal string internalField = "internal";
    
    // protected internal - доступ внутри сборки И в наследниках
    protected internal string protectedInternalField = "protected internal";
    
    // public - доступ везде
    public string publicField = "public";
    
    // private protected - доступ только в наследниках внутри сборки
    private protected string privateProtectedField = "private protected";
}
```

## 7. Виртуальные методы и переопределение

```csharp
public class BaseClass
{
    // Виртуальный метод - может быть переопределен
    public virtual void VirtualMethod()
    {
        Console.WriteLine("Base implementation");
    }
    
    // Обычный метод - не может быть переопределен
    public void NormalMethod()
    {
        Console.WriteLine("Base normal method");
    }
    
    // Абстрактный метод - должен быть реализован
    public abstract void AbstractMethod();
}

public class DerivedClass : BaseClass
{
    // Переопределение виртуального метода
    public override void VirtualMethod()
    {
        Console.WriteLine("Derived implementation");
        
        // Вызов базовой реализации
        base.VirtualMethod();
    }
    
    // Сокрытие метода (new keyword)
    public new void NormalMethod()
    {
        Console.WriteLine("Derived normal method");
    }
    
    // Реализация абстрактного метода
    public override void AbstractMethod()
    {
        Console.WriteLine("Abstract method implementation");
    }
}
```

## 8. Статические члены

```csharp
public class MathHelper
{
    // Статическое поле
    public static readonly double PI = Math.PI;
    
    // Статическое свойство
    public static int CalculationCount { get; private set; }
    
    // Статический конструктор
    static MathHelper()
    {
        CalculationCount = 0;
    }
    
    // Статический метод
    public static double CalculateCircleArea(double radius)
    {
        CalculationCount++;
        return PI * radius * radius;
    }
    
    // Статический метод с generic типами
    public static T Max<T>(T a, T b) where T : IComparable<T>
    {
        return a.CompareTo(b) > 0 ? a : b;
    }
}

// Использование
double area = MathHelper.CalculateCircleArea(5);
int max = MathHelper.Max(10, 20);
```

## Практические задания:

1. **Создайте иерархию классов** для системы управления библиотекой (Book, Author, Library, Member)
2. **Реализуйте интерфейс** для работы с базой данных (IDataRepository<T>)
3. **Создайте абстрактный класс** для различных типов транспорта
4. **Реализуйте паттерн Factory** для создания различных типов документов

## Ключевые моменты для собеседования:

- Понимание принципов ООП и их применения
- Умение создавать иерархии классов
- Знание разницы между абстрактными классами и интерфейсами
- Понимание полиморфизма и его типов
- Умение работать с модификаторами доступа
- Знание статических членов и их применения
