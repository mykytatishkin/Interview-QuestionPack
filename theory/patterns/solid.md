# SOLID принципы - Теория

## Введение

SOLID - это аббревиатура пяти основных принципов объектно-ориентированного программирования, предложенных Робертом Мартином. Эти принципы помогают создавать более читаемый, расширяемый и поддерживаемый код.

## 1. S - Single Responsibility Principle (Принцип единственной ответственности)

**Принцип:** Класс должен иметь только одну причину для изменения.

### ❌ Плохой пример:
```csharp
public class UserManager
{
    public void CreateUser(string username, string email, string password)
    {
        // Валидация данных
        if (string.IsNullOrEmpty(username))
            throw new ArgumentException("Username cannot be empty");
        
        if (string.IsNullOrEmpty(email))
            throw new ArgumentException("Email cannot be empty");
        
        // Хеширование пароля
        string hashedPassword = HashPassword(password);
        
        // Сохранение в базу данных
        using (var connection = new SqlConnection(connectionString))
        {
            var command = new SqlCommand("INSERT INTO Users VALUES (@username, @email, @password)", connection);
            command.Parameters.AddWithValue("@username", username);
            command.Parameters.AddWithValue("@email", email);
            command.Parameters.AddWithValue("@password", hashedPassword);
            connection.Open();
            command.ExecuteNonQuery();
        }
        
        // Отправка email подтверждения
        var emailService = new EmailService();
        emailService.SendConfirmationEmail(email);
        
        // Логирование
        var logger = new Logger();
        logger.Log($"User {username} created successfully");
    }
    
    private string HashPassword(string password)
    {
        // Логика хеширования
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}
```

### ✅ Хороший пример:
```csharp
// Класс для валидации
public class UserValidator
{
    public ValidationResult ValidateUser(string username, string email, string password)
    {
        var errors = new List<string>();
        
        if (string.IsNullOrEmpty(username))
            errors.Add("Username cannot be empty");
        
        if (string.IsNullOrEmpty(email))
            errors.Add("Email cannot be empty");
        
        if (string.IsNullOrEmpty(password))
            errors.Add("Password cannot be empty");
        
        return new ValidationResult(errors.Count == 0, errors);
    }
}

// Класс для хеширования паролей
public class PasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}

// Класс для работы с базой данных
public class UserRepository
{
    private readonly string connectionString;
    
    public UserRepository(string connectionString)
    {
        this.connectionString = connectionString;
    }
    
    public void SaveUser(User user)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            var command = new SqlCommand("INSERT INTO Users VALUES (@username, @email, @password)", connection);
            command.Parameters.AddWithValue("@username", user.Username);
            command.Parameters.AddWithValue("@email", user.Email);
            command.Parameters.AddWithValue("@password", user.HashedPassword);
            connection.Open();
            command.ExecuteNonQuery();
        }
    }
}

// Класс для отправки email
public class EmailService
{
    public void SendConfirmationEmail(string email)
    {
        // Логика отправки email
    }
}

// Класс для логирования
public class Logger
{
    public void Log(string message)
    {
        // Логика логирования
    }
}

// Основной класс, координирующий работу
public class UserManager
{
    private readonly UserValidator validator;
    private readonly PasswordHasher hasher;
    private readonly UserRepository repository;
    private readonly EmailService emailService;
    private readonly Logger logger;
    
    public UserManager(
        UserValidator validator,
        PasswordHasher hasher,
        UserRepository repository,
        EmailService emailService,
        Logger logger)
    {
        this.validator = validator;
        this.hasher = hasher;
        this.repository = repository;
        this.emailService = emailService;
        this.logger = logger;
    }
    
    public void CreateUser(string username, string email, string password)
    {
        // Валидация
        var validationResult = validator.ValidateUser(username, email, password);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(string.Join(", ", validationResult.Errors));
        }
        
        // Хеширование пароля
        string hashedPassword = hasher.HashPassword(password);
        
        // Создание объекта пользователя
        var user = new User { Username = username, Email = email, HashedPassword = hashedPassword };
        
        // Сохранение в базу
        repository.SaveUser(user);
        
        // Отправка email
        emailService.SendConfirmationEmail(email);
        
        // Логирование
        logger.Log($"User {username} created successfully");
    }
}
```

## 2. O - Open/Closed Principle (Принцип открытости/закрытости)

**Принцип:** Программные сущности должны быть открыты для расширения, но закрыты для модификации.

### ❌ Плохой пример:
```csharp
public class AreaCalculator
{
    public double CalculateArea(object shape)
    {
        if (shape is Rectangle rectangle)
        {
            return rectangle.Width * rectangle.Height;
        }
        else if (shape is Circle circle)
        {
            return Math.PI * circle.Radius * circle.Radius;
        }
        else if (shape is Triangle triangle)
        {
            return 0.5 * triangle.Base * triangle.Height;
        }
        
        throw new ArgumentException("Unknown shape type");
    }
}
```

### ✅ Хороший пример:
```csharp
public abstract class Shape
{
    public abstract double CalculateArea();
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

public class Circle : Shape
{
    public double Radius { get; set; }
    
    public override double CalculateArea()
    {
        return Math.PI * Radius * Radius;
    }
}

public class Triangle : Shape
{
    public double Base { get; set; }
    public double Height { get; set; }
    
    public override double CalculateArea()
    {
        return 0.5 * Base * Height;
    }
}

public class AreaCalculator
{
    public double CalculateTotalArea(Shape[] shapes)
    {
        return shapes.Sum(shape => shape.CalculateArea());
    }
}

// Теперь можно легко добавить новые фигуры без изменения существующего кода
public class Square : Shape
{
    public double Side { get; set; }
    
    public override double CalculateArea()
    {
        return Side * Side;
    }
}
```

## 3. L - Liskov Substitution Principle (Принцип подстановки Лисков)

**Принцип:** Объекты базового класса могут быть заменены объектами его подклассов без изменения корректности программы.

### ❌ Плохой пример:
```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    
    public int Area => Width * Height;
}

public class Square : Rectangle
{
    public override int Width
    {
        get { return base.Width; }
        set 
        { 
            base.Width = value;
            base.Height = value; // Нарушает LSP!
        }
    }
    
    public override int Height
    {
        get { return base.Height; }
        set 
        { 
            base.Width = value;  // Нарушает LSP!
            base.Height = value;
        }
    }
}

// Проблема: код, работающий с Rectangle, может сломаться при использовании Square
public void TestRectangle(Rectangle rectangle)
{
    rectangle.Width = 10;
    rectangle.Height = 5;
    
    // Ожидается площадь 50, но для Square получится 25
    Console.WriteLine($"Area: {rectangle.Area}");
}
```

### ✅ Хороший пример:
```csharp
public abstract class Shape
{
    public abstract int Area { get; }
}

public class Rectangle : Shape
{
    public int Width { get; set; }
    public int Height { get; set; }
    
    public override int Area => Width * Height;
}

public class Square : Shape
{
    public int Side { get; set; }
    
    public override int Area => Side * Side;
}

// Теперь код работает корректно с любыми наследниками Shape
public void TestShape(Shape shape)
{
    if (shape is Rectangle rectangle)
    {
        rectangle.Width = 10;
        rectangle.Height = 5;
    }
    else if (shape is Square square)
    {
        square.Side = 5;
    }
    
    Console.WriteLine($"Area: {shape.Area}");
}
```

## 4. I - Interface Segregation Principle (Принцип разделения интерфейса)

**Принцип:** Клиенты не должны зависеть от интерфейсов, которые они не используют.

### ❌ Плохой пример:
```csharp
public interface IWorker
{
    void Work();
    void Eat();
    void Sleep();
    void GetSalary();
    void TakeVacation();
}

public class Robot : IWorker
{
    public void Work()
    {
        // Робот может работать
    }
    
    public void Eat()
    {
        throw new NotImplementedException("Robots don't eat");
    }
    
    public void Sleep()
    {
        throw new NotImplementedException("Robots don't sleep");
    }
    
    public void GetSalary()
    {
        throw new NotImplementedException("Robots don't get salary");
    }
    
    public void TakeVacation()
    {
        throw new NotImplementedException("Robots don't take vacation");
    }
}
```

### ✅ Хороший пример:
```csharp
public interface IWorkable
{
    void Work();
}

public interface IEatable
{
    void Eat();
}

public interface ISleepable
{
    void Sleep();
}

public interface IPayable
{
    void GetSalary();
}

public interface IVacationable
{
    void TakeVacation();
}

// Человек реализует все интерфейсы
public class Human : IWorkable, IEatable, ISleepable, IPayable, IVacationable
{
    public void Work() { }
    public void Eat() { }
    public void Sleep() { }
    public void GetSalary() { }
    public void TakeVacation() { }
}

// Робот реализует только нужные интерфейсы
public class Robot : IWorkable
{
    public void Work() { }
}

// Код, работающий с работниками, может использовать только нужные интерфейсы
public class WorkManager
{
    public void ManageWork(IWorkable worker)
    {
        worker.Work();
    }
}

public class HumanResourcesManager
{
    public void ManageSalary(IPayable worker)
    {
        worker.GetSalary();
    }
    
    public void ManageVacation(IVacationable worker)
    {
        worker.TakeVacation();
    }
}
```

## 5. D - Dependency Inversion Principle (Принцип инверсии зависимостей)

**Принцип:** Зависимости должны строиться на абстракциях, а не на конкретных классах.

### ❌ Плохой пример:
```csharp
public class EmailNotifier
{
    public void SendNotification(string message)
    {
        // Отправка email
    }
}

public class OrderProcessor
{
    private readonly EmailNotifier emailNotifier;
    
    public OrderProcessor()
    {
        emailNotifier = new EmailNotifier(); // Жесткая зависимость
    }
    
    public void ProcessOrder(Order order)
    {
        // Обработка заказа
        emailNotifier.SendNotification("Order processed");
    }
}
```

### ✅ Хороший пример:
```csharp
public interface INotifier
{
    void SendNotification(string message);
}

public class EmailNotifier : INotifier
{
    public void SendNotification(string message)
    {
        // Отправка email
    }
}

public class SmsNotifier : INotifier
{
    public void SendNotification(string message)
    {
        // Отправка SMS
    }
}

public class PushNotifier : INotifier
{
    public void SendNotification(string message)
    {
        // Отправка push-уведомления
    }
}

public class OrderProcessor
{
    private readonly INotifier notifier;
    
    public OrderProcessor(INotifier notifier) // Зависимость через интерфейс
    {
        this.notifier = notifier;
    }
    
    public void ProcessOrder(Order order)
    {
        // Обработка заказа
        notifier.SendNotification("Order processed");
    }
}

// Использование с Dependency Injection
public class Program
{
    public static void Main()
    {
        // Можно легко заменить тип уведомлений
        INotifier notifier = new EmailNotifier();
        // INotifier notifier = new SmsNotifier();
        // INotifier notifier = new PushNotifier();
        
        var orderProcessor = new OrderProcessor(notifier);
        orderProcessor.ProcessOrder(new Order());
    }
}
```

## Практические примеры применения SOLID

### Пример 1: Система обработки платежей
```csharp
public interface IPaymentProcessor
{
    bool ProcessPayment(decimal amount, string currency);
}

public interface IPaymentValidator
{
    bool ValidatePayment(decimal amount, string currency);
}

public interface IPaymentLogger
{
    void LogPayment(decimal amount, string currency, bool success);
}

public class CreditCardProcessor : IPaymentProcessor
{
    public bool ProcessPayment(decimal amount, string currency)
    {
        // Логика обработки кредитной карты
        return true;
    }
}

public class PaymentService
{
    private readonly IPaymentProcessor processor;
    private readonly IPaymentValidator validator;
    private readonly IPaymentLogger logger;
    
    public PaymentService(
        IPaymentProcessor processor,
        IPaymentValidator validator,
        IPaymentLogger logger)
    {
        this.processor = processor;
        this.validator = validator;
        this.logger = logger;
    }
    
    public bool ProcessPayment(decimal amount, string currency)
    {
        if (!validator.ValidatePayment(amount, currency))
        {
            logger.LogPayment(amount, currency, false);
            return false;
        }
        
        bool success = processor.ProcessPayment(amount, currency);
        logger.LogPayment(amount, currency, success);
        
        return success;
    }
}
```

### Пример 2: Система уведомлений
```csharp
public interface INotificationChannel
{
    void Send(string message, string recipient);
}

public class EmailChannel : INotificationChannel
{
    public void Send(string message, string recipient)
    {
        // Отправка email
    }
}

public class SmsChannel : INotificationChannel
{
    public void Send(string message, string recipient)
    {
        // Отправка SMS
    }
}

public class NotificationService
{
    private readonly IEnumerable<INotificationChannel> channels;
    
    public NotificationService(IEnumerable<INotificationChannel> channels)
    {
        this.channels = channels;
    }
    
    public void SendNotification(string message, string recipient)
    {
        foreach (var channel in channels)
        {
            channel.Send(message, recipient);
        }
    }
}
```

## Ключевые моменты для собеседования:

1. **SRP:** Каждый класс должен иметь одну ответственность
2. **OCP:** Расширяйте функциональность через наследование, а не модификацию
3. **LSP:** Подклассы должны корректно работать везде, где используется базовый класс
4. **ISP:** Создавайте специализированные интерфейсы вместо универсальных
5. **DIP:** Зависите от абстракций, а не от конкретных реализаций

## Практические задания:

1. **Рефакторинг класса** с нарушением SRP
2. **Создание иерархии** с соблюдением LSP
3. **Разделение интерфейса** на специализированные
4. **Внедрение зависимостей** через интерфейсы
5. **Применение SOLID** в реальном проекте
