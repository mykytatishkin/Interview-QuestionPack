# Архитектура .NET - Теория

## 1. Обзор архитектуры .NET

### Что такое .NET?
**.NET** - это бесплатная кроссплатформенная платформа разработки с открытым исходным кодом, созданная Microsoft для создания различных типов приложений.

### Основные компоненты:
- **CLR (Common Language Runtime)** - среда выполнения
- **BCL (Base Class Library)** - базовые классы
- **FCL (Framework Class Library)** - расширенная библиотека классов
- **Языки программирования** - C#, F#, Visual Basic
- **Инструменты разработки** - Visual Studio, .NET CLI

## 2. .NET Framework vs .NET Core vs .NET 5+

### .NET Framework (Legacy)
- **Платформа:** Только Windows
- **Версии:** 1.0 - 4.8
- **Особенности:** Зрелая платформа, много legacy приложений
- **Использование:** Корпоративные приложения Windows

### .NET Core (Discontinued)
- **Платформа:** Кроссплатформенная
- **Версии:** 1.0 - 3.1
- **Особенности:** Высокая производительность, модульность
- **Использование:** Микросервисы, веб-приложения

### .NET 5+ (Unified)
- **Платформа:** Кроссплатформенная
- **Версии:** 5.0, 6.0, 7.0, 8.0
- **Особенности:** Объединение всех платформ, высокая производительность
- **Использование:** Все типы приложений

## 3. CLR (Common Language Runtime)

### Что такое CLR?
**CLR** - это среда выполнения, которая управляет выполнением .NET программ.

### Основные функции:
```csharp
// Пример работы CLR
public class Program
{
    public static void Main()
    {
        // CLR автоматически:
        // 1. Загружает сборку
        // 2. Выполняет JIT компиляцию
        // 3. Управляет памятью
        // 4. Обрабатывает исключения
        
        var calculator = new Calculator();
        int result = calculator.Add(5, 3);
        Console.WriteLine($"Result: {result}");
    }
}

public class Calculator
{
    public int Add(int a, int b) => a + b;
}
```

### Процесс выполнения:
1. **Компиляция C# в IL (Intermediate Language)**
2. **Загрузка сборки в CLR**
3. **JIT компиляция IL в машинный код**
4. **Выполнение машинного кода**

## 4. Сборки (Assemblies)

### Что такое сборка?
**Сборка** - это единица развертывания в .NET, содержащая IL код, метаданные и ресурсы.

### Типы сборок:
```csharp
// Исполняемая сборка (.exe)
// Program.cs -> Program.exe

// Библиотека (.dll)
// MyLibrary.cs -> MyLibrary.dll

// Сборка с ресурсами
[assembly: AssemblyTitle("My Application")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]
```

### Структура сборки:
```
MyAssembly.dll
├── Assembly Manifest (метаданные)
├── IL Code (промежуточный язык)
├── Resources (ресурсы)
└── Dependencies (зависимости)
```

## 5. Управление памятью

### Сборщик мусора (Garbage Collector)
```csharp
public class MemoryExample
{
    public void DemonstrateGC()
    {
        // Создание объектов
        var list = new List<string>();
        for (int i = 0; i < 1000000; i++)
        {
            list.Add($"Item {i}");
        }
        
        // Объекты автоматически удаляются GC
        // когда на них нет ссылок
        
        // Принудительный вызов GC (не рекомендуется)
        GC.Collect();
        GC.WaitForPendingFinalizers();
    }
}
```

### Использование using statement:
```csharp
public class ResourceManager
{
    public void UseResource()
    {
        // Автоматическое освобождение ресурсов
        using (var stream = new FileStream("test.txt", FileMode.Open))
        using (var reader = new StreamReader(stream))
        {
            string content = reader.ReadToEnd();
            Console.WriteLine(content);
        } // Ресурсы автоматически освобождаются
    }
    
    // C# 8.0+ using declaration
    public void UseResourceModern()
    {
        using var stream = new FileStream("test.txt", FileMode.Open);
        using var reader = new StreamReader(stream);
        string content = reader.ReadToEnd();
        Console.WriteLine(content);
    } // Ресурсы освобождаются в конце метода
}
```

## 6. Типы данных и системы типов

### Value Types vs Reference Types
```csharp
public class TypeSystemExample
{
    public void DemonstrateTypes()
    {
        // Value Types (хранятся в стеке)
        int number = 42;
        double price = 19.99;
        DateTime date = DateTime.Now;
        Point point = new Point(10, 20);
        
        // Reference Types (хранятся в куче)
        string text = "Hello";
        object obj = new object();
        List<int> numbers = new List<int>();
        CustomClass instance = new CustomClass();
        
        // Boxing (value type -> reference type)
        object boxedNumber = number; // Boxing
        
        // Unboxing (reference type -> value type)
        int unboxedNumber = (int)boxedNumber; // Unboxing
    }
}

// Value type (struct)
public struct Point
{
    public int X { get; set; }
    public int Y { get; set; }
    
    public Point(int x, int y)
    {
        X = x;
        Y = y;
    }
}

// Reference type (class)
public class CustomClass
{
    public string Name { get; set; }
}
```

## 7. Метаданные и рефлексия

### Метаданные
```csharp
// Метаданные автоматически генерируются компилятором
public class Person
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; }
    
    [Range(0, 150)]
    public int Age { get; set; }
    
    [EmailAddress]
    public string Email { get; set; }
}
```

### Рефлексия
```csharp
public class ReflectionExample
{
    public void DemonstrateReflection()
    {
        // Получение типа во время выполнения
        Type personType = typeof(Person);
        
        // Получение свойств
        PropertyInfo[] properties = personType.GetProperties();
        foreach (var prop in properties)
        {
            Console.WriteLine($"Property: {prop.Name}, Type: {prop.PropertyType}");
            
            // Получение атрибутов
            var attributes = prop.GetCustomAttributes(true);
            foreach (var attr in attributes)
            {
                Console.WriteLine($"  Attribute: {attr.GetType().Name}");
            }
        }
        
        // Создание экземпляра через рефлексию
        var person = Activator.CreateInstance<Person>();
        
        // Установка значения свойства
        var nameProperty = personType.GetProperty("Name");
        nameProperty?.SetValue(person, "John Doe");
    }
}
```

## 8. Атрибуты

### Встроенные атрибуты:
```csharp
// Атрибут для сериализации
[Serializable]
public class SerializableClass
{
    public string Name { get; set; }
    public int Age { get; set; }
}

// Атрибут для устаревших методов
[Obsolete("Use NewMethod instead", true)]
public void OldMethod()
{
    // Устаревшая реализация
}

// Атрибут для условной компиляции
[Conditional("DEBUG")]
public void DebugMethod()
{
    Console.WriteLine("This method only runs in DEBUG mode");
}

// Атрибут для валидации
public class ValidationExample
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; }
    
    [Range(18, 100, ErrorMessage = "Age must be between 18 and 100")]
    public int Age { get; set; }
    
    [RegularExpression(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    public string Email { get; set; }
}
```

### Создание пользовательских атрибутов:
```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class CustomAttribute : Attribute
{
    public string Description { get; }
    public int Priority { get; set; }
    
    public CustomAttribute(string description)
    {
        Description = description;
        Priority = 1;
    }
}

[Custom("Important business logic", Priority = 5)]
public class BusinessService
{
    [Custom("Critical operation")]
    public void ProcessData()
    {
        // Реализация
    }
}
```

## 9. Пространства имен и сборки

### Организация кода:
```csharp
// Пространство имен для логической группировки
namespace MyCompany.MyProject
{
    namespace Models
    {
        public class User { }
        public class Product { }
    }
    
    namespace Services
    {
        public class UserService { }
        public class ProductService { }
    }
    
    namespace Controllers
    {
        public class UserController { }
        public class ProductController { }
    }
}

// Использование using для импорта
using MyCompany.MyProject.Models;
using MyCompany.MyProject.Services;
using MyCompany.MyProject.Controllers;

// Глобальные using (C# 10.0+)
global using System;
global using System.Collections.Generic;
global using System.Linq;
```

## 10. Конфигурация и настройки

### appsettings.json:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MyDb;Trusted_Connection=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "AppSettings": {
    "ApiKey": "your-api-key",
    "MaxRetryAttempts": 3,
    "TimeoutSeconds": 30
  }
}
```

### Работа с конфигурацией:
```csharp
public class ConfigurationExample
{
    private readonly IConfiguration _configuration;
    
    public ConfigurationExample(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public void UseConfiguration()
    {
        // Получение строки подключения
        string connectionString = _configuration.GetConnectionString("DefaultConnection");
        
        // Получение значения
        string apiKey = _configuration["AppSettings:ApiKey"];
        int maxRetries = _configuration.GetValue<int>("AppSettings:MaxRetryAttempts");
        
        // Привязка к объекту
        var appSettings = new AppSettings();
        _configuration.GetSection("AppSettings").Bind(appSettings);
    }
}

public class AppSettings
{
    public string ApiKey { get; set; }
    public int MaxRetryAttempts { get; set; }
    public int TimeoutSeconds { get; set; }
}
```

## 11. Логирование

### Встроенная система логирования:
```csharp
public class LoggingExample
{
    private readonly ILogger<LoggingExample> _logger;
    
    public LoggingExample(ILogger<LoggingExample> logger)
    {
        _logger = logger;
    }
    
    public void ProcessData()
    {
        _logger.LogInformation("Starting data processing");
        
        try
        {
            // Логика обработки
            _logger.LogDebug("Processing item {ItemId}", 123);
            
            if (someCondition)
            {
                _logger.LogWarning("Unexpected condition encountered");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while processing data");
            throw;
        }
        
        _logger.LogInformation("Data processing completed successfully");
    }
}
```

## 12. Dependency Injection

### Встроенный DI контейнер:
```csharp
// Регистрация сервисов
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Singleton - один экземпляр на все приложение
        services.AddSingleton<IConfigurationService, ConfigurationService>();
        
        // Scoped - один экземпляр на запрос
        services.AddScoped<IUserService, UserService>();
        
        // Transient - новый экземпляр каждый раз
        services.AddTransient<IEmailService, EmailService>();
        
        // Регистрация интерфейса с реализацией
        services.AddScoped<IRepository<User>, UserRepository>();
        
        // Регистрация с фабрикой
        services.AddScoped<IConnectionFactory>(provider =>
        {
            var config = provider.GetService<IConfiguration>();
            return new ConnectionFactory(config.GetConnectionString("Default"));
        });
    }
}

// Использование DI
public class UserController
{
    private readonly IUserService _userService;
    private readonly ILogger<UserController> _logger;
    
    public UserController(IUserService userService, ILogger<UserController> logger)
    {
        _userService = userService;
        _logger = logger;
    }
    
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        return Ok(user);
    }
}
```

## Практические задания:

1. **Создайте консольное приложение** с использованием различных типов данных
2. **Реализуйте класс с атрибутами** для валидации данных
3. **Создайте библиотеку классов** с использованием пространств имен
4. **Настройте логирование** в приложении
5. **Реализуйте Dependency Injection** для простого сервиса

## Ключевые моменты для собеседования:

- Понимание архитектуры .NET и CLR
- Знание различий между версиями .NET
- Умение работать с типами данных и сборками
- Понимание управления памятью и GC
- Знание рефлексии и метаданных
- Умение настраивать и использовать DI контейнер
