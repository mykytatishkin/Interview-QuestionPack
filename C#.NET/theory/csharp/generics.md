# Generics в C# - Теория

## 1. Что такое Generics?

**Generics** - это механизм, позволяющий создавать классы, методы и интерфейсы, которые работают с различными типами данных, сохраняя при этом type safety во время компиляции.

### Преимущества:
- **Type Safety** - ошибки типов выявляются на этапе компиляции
- **Performance** - избегаем boxing/unboxing для value types
- **Code Reuse** - один код для разных типов
- **IntelliSense** - полная поддержка автодополнения

## 2. Базовые примеры

### Generic классы:
```csharp
public class GenericRepository<T> where T : class
{
    private readonly List<T> _items = new List<T>();
    
    public void Add(T item)
    {
        _items.Add(item);
    }
    
    public T GetById(int id)
    {
        // Логика поиска
        return _items.FirstOrDefault();
    }
    
    public IEnumerable<T> GetAll()
    {
        return _items;
    }
}

// Использование
var userRepo = new GenericRepository<User>();
var productRepo = new GenericRepository<Product>();
```

### Generic методы:
```csharp
public class Utility
{
    public static T Max<T>(T a, T b) where T : IComparable<T>
    {
        return a.CompareTo(b) > 0 ? a : b;
    }
    
    public static void Swap<T>(ref T a, ref T b)
    {
        T temp = a;
        a = b;
        b = temp;
    }
}

// Использование
int maxInt = Utility.Max(10, 20);
string maxString = Utility.Max("apple", "banana");

int x = 5, y = 10;
Utility.Swap(ref x, ref y);
```

## 3. Ограничения (Constraints)

### Типы ограничений:
```csharp
// where T : class - ссылочный тип
public class Repository<T> where T : class
{
    // T должен быть ссылочным типом
}

// where T : struct - значимый тип
public class ValueContainer<T> where T : struct
{
    // T должен быть значимым типом
}

// where T : new() - должен иметь конструктор по умолчанию
public class Factory<T> where T : new()
{
    public T Create()
    {
        return new T();
    }
}

// where T : BaseClass - наследование от конкретного класса
public class Service<T> where T : BaseEntity
{
    // T должен наследоваться от BaseEntity
}

// where T : IInterface - реализация интерфейса
public class Processor<T> where T : IProcessable
{
    public void Process(T item)
    {
        item.Process();
    }
}

// Комбинированные ограничения
public class AdvancedRepository<T> where T : class, IEntity, new()
{
    // T должен быть ссылочным типом, реализовывать IEntity и иметь конструктор по умолчанию
}
```

## 4. Generic интерфейсы

```csharp
public interface IRepository<T> where T : class
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
}

public interface IReadOnlyRepository<T> where T : class
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
}

// Наследование generic интерфейсов
public interface IUserRepository : IRepository<User>
{
    Task<User> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetActiveUsersAsync();
}
```

## 5. Generic коллекции

### Создание собственной generic коллекции:
```csharp
public class GenericList<T>
{
    private T[] _items;
    private int _count;
    
    public GenericList(int capacity = 4)
    {
        _items = new T[capacity];
        _count = 0;
    }
    
    public void Add(T item)
    {
        if (_count >= _items.Length)
        {
            Array.Resize(ref _items, _items.Length * 2);
        }
        
        _items[_count] = item;
        _count++;
    }
    
    public T this[int index]
    {
        get
        {
            if (index < 0 || index >= _count)
                throw new IndexOutOfRangeException();
            return _items[index];
        }
        set
        {
            if (index < 0 || index >= _count)
                throw new IndexOutOfRangeException();
            _items[index] = value;
        }
    }
    
    public int Count => _count;
}
```

## 6. Ковариантность и контравариантность

### Ковариантность (out):
```csharp
public interface IProducer<out T>
{
    T Produce();
}

public class StringProducer : IProducer<string>
{
    public string Produce() => "Hello";
}

// Можно присвоить более конкретный тип более общему
IProducer<object> producer = new StringProducer();
```

### Контравариантность (in):
```csharp
public interface IConsumer<in T>
{
    void Consume(T item);
}

public class ObjectConsumer : IConsumer<object>
{
    public void Consume(object item) { }
}

// Можно присвоить более общий тип более конкретному
IConsumer<string> consumer = new ObjectConsumer();
```

## 7. Практические примеры

### Generic репозиторий с Entity Framework:
```csharp
public class GenericRepository<T> : IRepository<T> where T : class
{
    private readonly DbContext _context;
    private readonly DbSet<T> _dbSet;
    
    public GenericRepository(DbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    
    public async Task<T> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }
    
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }
    
    public async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
    }
    
    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }
    
    public async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
```

### Generic сервис для работы с API:
```csharp
public class ApiService<T> where T : class
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    
    public ApiService(HttpClient httpClient, string baseUrl)
    {
        _httpClient = httpClient;
        _baseUrl = baseUrl;
    }
    
    public async Task<T> GetAsync(int id)
    {
        var response = await _httpClient.GetAsync($"{_baseUrl}/{id}");
        response.EnsureSuccessStatusCode();
        
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json);
    }
    
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        var response = await _httpClient.GetAsync(_baseUrl);
        response.EnsureSuccessStatusCode();
        
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<IEnumerable<T>>(json);
    }
    
    public async Task<T> PostAsync(T entity)
    {
        var json = JsonSerializer.Serialize(entity);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync(_baseUrl, content);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(responseJson);
    }
}
```

## 8. Связь с принципом DRY

### Без generics (нарушение DRY):
```csharp
public class UserRepository
{
    public User GetUser(int id) { /* логика */ }
    public void SaveUser(User user) { /* логика */ }
}

public class ProductRepository
{
    public Product GetProduct(int id) { /* дублирование логики */ }
    public void SaveProduct(Product product) { /* дублирование логики */ }
}

public class OrderRepository
{
    public Order GetOrder(int id) { /* дублирование логики */ }
    public void SaveOrder(Order order) { /* дублирование логики */ }
}
```

### С generics (соблюдение DRY):
```csharp
public class GenericRepository<T> where T : class
{
    public T Get(int id) { /* общая логика */ }
    public void Save(T entity) { /* общая логика */ }
}

// Использование
var userRepo = new GenericRepository<User>();
var productRepo = new GenericRepository<Product>();
var orderRepo = new GenericRepository<Order>();
```

## 9. Ограничения и рекомендации

### Что можно делать:
- Создавать generic классы, методы, интерфейсы
- Использовать множественные ограничения
- Применять ковариантность и контравариантность
- Создавать generic делегаты

### Что нельзя делать:
- Создавать generic перечисления
- Создавать generic статические классы
- Использовать generic типы в атрибутах

### Рекомендации:
- Используйте понятные имена для generic параметров (T, TKey, TValue)
- Применяйте ограничения для обеспечения type safety
- Избегайте излишней сложности в generic типах
- Документируйте ограничения и их назначение

## Практические задания:

1. **Создайте generic класс** для работы с кэшем
2. **Реализуйте generic метод** для поиска максимального элемента в коллекции
3. **Создайте generic интерфейс** для валидации объектов
4. **Реализуйте generic фабрику** для создания объектов

## Ключевые моменты для собеседования:

- Понимание принципа DRY и как generics помогают его соблюдать
- Знание типов ограничений и их применения
- Умение создавать generic репозитории и сервисы
- Понимание ковариантности и контравариантности
- Знание ограничений generic типов
