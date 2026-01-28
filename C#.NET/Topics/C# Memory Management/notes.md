---
title: C# Memory Management — Управление памятью
category: C#
---

# C# Memory Management — Управление памятью

**Навигация:** [[../Index|← Topics]]

---

## 1. Архитектура памяти в .NET

### Управляемая и неуправляемая память:
- **Управляемая память** - управляется CLR и сборщиком мусора
- **Неуправляемая память** - управляется вручную (файлы, сокеты, COM объекты)

### Структура памяти:
```
┌─────────────────┐
│   Stack (Стек)  │ ← Value types, ссылки на объекты
├─────────────────┤
│   Heap (Куча)   │ ← Reference types, большие value types
│                 │
│   Generation 0  │ ← Молодые объекты (быстрая проверка)
│   Generation 1  │ ← Средние объекты
│   Generation 2  │ ← Старые объекты (медленная проверка)
└─────────────────┘
```

## 2. Сборщик мусора (Garbage Collector)

### Как работает GC:
```csharp
public class GarbageCollectionExample
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
        
        // Принудительный вызов GC (не рекомендуется в production)
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect(); // Второй вызов для очистки finalizable объектов
    }
}
```

### Поколения (Generations):
```csharp
public class GenerationExample
{
    public void DemonstrateGenerations()
    {
        // Создание объекта в Generation 0
        var obj = new MyClass();
        
        // Проверка поколения объекта
        int generation = GC.GetGeneration(obj);
        Console.WriteLine($"Object is in generation: {generation}");
        
        // Принудительная сборка мусора
        GC.Collect(0); // Только Generation 0
        GC.Collect(1); // Generation 0 и 1
        GC.Collect(2); // Все поколения
        
        // Проверка поколения после сборки
        generation = GC.GetGeneration(obj);
        Console.WriteLine($"Object is now in generation: {generation}");
    }
}

public class MyClass
{
    public string Data { get; set; }
}
```

### Типы сборщиков мусора:
- **Workstation GC** - для клиентских приложений
- **Server GC** - для серверных приложений
- **Concurrent GC** - параллельная сборка (по умолчанию)
- **Non-concurrent GC** - блокирующая сборка

## 3. Memory Leaks

### Причины утечек памяти:
```csharp
public class MemoryLeakExamples
{
    // 1. Неосвобожденные события
    private static event EventHandler StaticEvent;
    
    public void SubscribeToEvent()
    {
        var handler = new EventHandler(OnEvent);
        StaticEvent += handler; // Утечка! Не отписываемся
    }
    
    private void OnEvent(object sender, EventArgs e) { }
    
    // 2. Неосвобожденные ресурсы
    public void FileOperation()
    {
        var fileStream = new FileStream("test.txt", FileMode.Open);
        // Утечка! Не вызываем Dispose()
    }
    
    // 3. Циклические ссылки
    public class Node
    {
        public Node Parent { get; set; }
        public List<Node> Children { get; set; } = new List<Node>();
    }
    
    public void CreateCircularReference()
    {
        var parent = new Node();
        var child = new Node();
        
        parent.Children.Add(child);
        child.Parent = parent; // Циклическая ссылка
    }
    
    // 4. Кэши без ограничений
    private static Dictionary<string, object> _cache = new();
    
    public void AddToCache(string key, object value)
    {
        _cache[key] = value; // Утечка! Кэш растет бесконечно
    }
}
```

### Как избежать утечек:
```csharp
public class MemoryLeakPrevention
{
    // 1. Правильная отписка от событий
    private EventHandler _eventHandler;
    
    public void SubscribeToEvent()
    {
        _eventHandler = OnEvent;
        StaticEvent += _eventHandler;
    }
    
    public void UnsubscribeFromEvent()
    {
        if (_eventHandler != null)
        {
            StaticEvent -= _eventHandler;
            _eventHandler = null;
        }
    }
    
    // 2. Использование using statement
    public void FileOperation()
    {
        using (var fileStream = new FileStream("test.txt", FileMode.Open))
        {
            // Работа с файлом
        } // Автоматический вызов Dispose()
    }
    
    // 3. Слабая ссылка для разрыва циклов
    public class NodeWithWeakReference
    {
        public WeakReference<Node> Parent { get; set; }
        public List<Node> Children { get; set; } = new List<Node>();
    }
    
    // 4. Ограниченный кэш
    private static readonly MemoryCache _cache = new MemoryCache(new MemoryCacheOptions
    {
        SizeLimit = 1000 // Ограничение размера
    });
    
    public void AddToCache(string key, object value)
    {
        _cache.Set(key, value, TimeSpan.FromMinutes(5)); // TTL
    }
}
```

## 4. IDisposable и using

### Реализация IDisposable:
```csharp
public class ResourceManager : IDisposable
{
    private bool _disposed = false;
    private FileStream _fileStream;
    private StreamReader _reader;
    
    public ResourceManager(string filePath)
    {
        _fileStream = new FileStream(filePath, FileMode.Open);
        _reader = new StreamReader(_fileStream);
    }
    
    public void DoWork()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(ResourceManager));
        
        // Работа с ресурсами
        string content = _reader.ReadToEnd();
        Console.WriteLine(content);
    }
    
    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
    
    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                // Освобождение управляемых ресурсов
                _reader?.Dispose();
                _fileStream?.Dispose();
            }
            
            // Освобождение неуправляемых ресурсов
            // (если есть)
            
            _disposed = true;
        }
    }
    
    // Финализатор (только если есть неуправляемые ресурсы)
    ~ResourceManager()
    {
        Dispose(false);
    }
}
```

### Использование using:
```csharp
public class UsingExamples
{
    // Классический using
    public void ClassicUsing()
    {
        using (var resource = new ResourceManager("test.txt"))
        {
            resource.DoWork();
        } // Автоматический вызов Dispose()
    }
    
    // Using declaration (C# 8.0+)
    public void ModernUsing()
    {
        using var resource = new ResourceManager("test.txt");
        resource.DoWork();
    } // Dispose() вызывается в конце метода
    
    // Множественные using
    public void MultipleUsing()
    {
        using (var fileStream = new FileStream("test.txt", FileMode.Open))
        using (var reader = new StreamReader(fileStream))
        {
            string content = reader.ReadToEnd();
            Console.WriteLine(content);
        }
    }
    
    // Using с исключениями
    public void UsingWithExceptions()
    {
        try
        {
            using var resource = new ResourceManager("test.txt");
            resource.DoWork();
            throw new Exception("Something went wrong");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            // Dispose() все равно будет вызван
        }
    }
}
```

## 5. WeakReference

### Использование слабых ссылок:
```csharp
public class WeakReferenceExample
{
    public void DemonstrateWeakReference()
    {
        // Создание объекта
        var largeObject = new LargeObject();
        
        // Создание слабой ссылки
        var weakRef = new WeakReference(largeObject);
        
        // Проверка, жив ли объект
        if (weakRef.IsAlive)
        {
            Console.WriteLine("Object is alive");
            
            // Получение объекта
            if (weakRef.Target is LargeObject obj)
            {
                obj.DoSomething();
            }
        }
        
        // Удаление сильной ссылки
        largeObject = null;
        
        // Принудительная сборка мусора
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        // Проверка после сборки
        if (weakRef.IsAlive)
        {
            Console.WriteLine("Object is still alive");
        }
        else
        {
            Console.WriteLine("Object has been garbage collected");
        }
    }
}

public class LargeObject
{
    private byte[] _data = new byte[1024 * 1024]; // 1MB
    
    public void DoSomething()
    {
        Console.WriteLine("Doing something with large object");
    }
}
```

## 6. Memory<T> и Span<T>

### Работа с памятью без копирования:
```csharp
public class MemorySpanExamples
{
    public void DemonstrateSpan()
    {
        // Span для работы с массивами
        int[] array = { 1, 2, 3, 4, 5 };
        Span<int> span = array.AsSpan();
        
        // Изменение через span
        span[0] = 10;
        Console.WriteLine($"Array[0]: {array[0]}"); // 10
        
        // Slice для получения части
        Span<int> slice = span.Slice(1, 3);
        foreach (int item in slice)
        {
            Console.WriteLine(item);
        }
    }
    
    public void DemonstrateMemory()
    {
        // Memory для асинхронных операций
        byte[] buffer = new byte[1024];
        Memory<byte> memory = buffer.AsMemory();
        
        // Асинхронная операция
        ProcessMemoryAsync(memory);
    }
    
    private async Task ProcessMemoryAsync(Memory<byte> memory)
    {
        // Имитация асинхронной обработки
        await Task.Delay(100);
        
        // Работа с памятью
        memory.Span[0] = 255;
    }
}
```

## 7. Профилирование памяти

### Инструменты для анализа:
```csharp
public class MemoryProfiling
{
    public void DemonstrateProfiling()
    {
        // Получение информации о памяти
        long memoryBefore = GC.GetTotalMemory(false);
        
        // Создание объектов
        var list = new List<string>();
        for (int i = 0; i < 100000; i++)
        {
            list.Add($"Item {i}");
        }
        
        long memoryAfter = GC.GetTotalMemory(false);
        long memoryUsed = memoryAfter - memoryBefore;
        
        Console.WriteLine($"Memory used: {memoryUsed / 1024} KB");
        
        // Информация о поколениях
        for (int i = 0; i <= 2; i++)
        {
            long genMemory = GC.GetTotalMemory(false);
            Console.WriteLine($"Generation {i} memory: {genMemory / 1024} KB");
        }
    }
}
```

### Рекомендации по профилированию:
- Используйте **dotMemory** или **PerfView**
- Мониторьте **GC pressure** и **allocation rate**
- Проверяйте **large object heap** (LOH)
- Анализируйте **finalization queue**

## 8. Лучшие практики

### Оптимизация памяти:
```csharp
public class MemoryOptimization
{
    // 1. Переиспользование объектов
    private static readonly StringBuilder _stringBuilder = new StringBuilder();
    
    public string BuildString(IEnumerable<string> items)
    {
        _stringBuilder.Clear(); // Очистка вместо создания нового
        
        foreach (string item in items)
        {
            _stringBuilder.Append(item);
        }
        
        return _stringBuilder.ToString();
    }
    
    // 2. Использование ArrayPool
    public void ProcessData()
    {
        var pool = ArrayPool<byte>.Shared;
        byte[] buffer = pool.Rent(1024); // Аренда буфера
        
        try
        {
            // Работа с буфером
            ProcessBuffer(buffer);
        }
        finally
        {
            pool.Return(buffer); // Возврат в пул
        }
    }
    
    private void ProcessBuffer(byte[] buffer)
    {
        // Обработка данных
    }
    
    // 3. Избегание boxing/unboxing
    public void AvoidBoxing()
    {
        // Плохо - boxing
        object value = 42;
        int result = (int)value; // unboxing
        
        // Хорошо - generics
        var value2 = 42;
        int result2 = value2; // без boxing/unboxing
    }
}
```

### Паттерны для управления памятью:
```csharp
// 1. Object Pool
public class ObjectPool<T> where T : class, new()
{
    private readonly ConcurrentQueue<T> _objects = new();
    private readonly Func<T> _objectGenerator;
    
    public ObjectPool(Func<T> objectGenerator = null)
    {
        _objectGenerator = objectGenerator ?? (() => new T());
    }
    
    public T Get()
    {
        if (_objects.TryDequeue(out T item))
        {
            return item;
        }
        
        return _objectGenerator();
    }
    
    public void Return(T item)
    {
        _objects.Enqueue(item);
    }
}

// 2. Lazy Initialization
public class LazyExample
{
    private Lazy<ExpensiveObject> _expensiveObject = new Lazy<ExpensiveObject>();
    
    public ExpensiveObject GetExpensiveObject()
    {
        return _expensiveObject.Value; // Создается только при первом обращении
    }
}

public class ExpensiveObject
{
    public ExpensiveObject()
    {
        // Дорогая инициализация
        Thread.Sleep(1000);
    }
}
```

## Практические задания:

1. **Создайте класс** с правильной реализацией IDisposable
2. **Реализуйте Object Pool** для переиспользования объектов
3. **Найдите утечки памяти** в предоставленном коде
4. **Оптимизируйте производительность** используя Span<T> и Memory<T>

---

## 🎯 Быстрый опросник

> [!tip] Пройди опросник после изучения теории

### Вопрос 1
Как работает Garbage Collector в .NET?

<details>
<summary>Ответ</summary>

- GC автоматически освобождает память от объектов, на которые нет ссылок
- Работает в 3 поколениях: Gen 0 (молодые), Gen 1 (средние), Gen 2 (старые)
- Gen 0 проверяется чаще всего, Gen 2 реже всего
- Объекты перемещаются в следующее поколение после выживания сборки
</details>

---

### Вопрос 2
Когда использовать IDisposable?

<details>
<summary>Ответ</summary>

- Когда класс использует неуправляемые ресурсы (файлы, сокеты, дескрипторы)
- Когда класс владеет объектами, реализующими IDisposable
- Для освобождения ресурсов до следующей сборки мусора
- Всегда используй `using` для объектов с IDisposable
</details>

---

### Вопрос 3
В чем разница между `using` и `try-finally` с Dispose?

<details>
<summary>Ответ</summary>

- `using` — синтаксический сахар для `try-finally` с вызовом Dispose
- `using` гарантирует вызов Dispose даже при исключении
- `using` более читаемый и безопасный
- `try-finally` нужен для более сложной логики освобождения
</details>

---

### Вопрос 4
Что такое утечка памяти и как ее предотвратить?

<details>
<summary>Ответ</summary>

- Утечка — объекты остаются в памяти, хотя больше не нужны
- Причины: события (не отписались), статические коллекции, циклические ссылки
- Предотвращение: отписка от событий, очистка статических коллекций, использование WeakReference
</details>

---

### Вопрос 5
Что такое Large Object Heap (LOH)?

<details>
<summary>Ответ</summary>

- LOH — специальная область heap для объектов > 85KB
- Объекты в LOH не перемещаются при сборке мусора
- Сборка LOH происходит только при полной сборке (Gen 2)
- Может привести к фрагментации памяти
</details>

---

### Вопрос 6
Когда вызывать GC.Collect()?

<details>
<summary>Ответ</summary>

- **Никогда в production коде** — GC сам знает когда собирать
- Только для тестирования или профилирования
- GC.Collect() может ухудшить производительность
- Доверься автоматической работе GC
</details>

---

### Вопрос 7
В чем разница между Stack и Heap?

<details>
<summary>Ответ</summary>

- **Stack** — быстрая память для value types и ссылок, автоматическое управление
- **Heap** — медленная память для reference types, управляется GC
- Stack ограничен по размеру, Heap может расти
- Stack быстрее, но ограничен; Heap медленнее, но гибкий
</details>

---

## 🔗 Навигация

← [[../Index|Вернуться к списку тем]]

---

## 📖 Рекомендуемый порядок

1. Изучи теорию выше
2. Пройди [[quick_check|быстрый опросник]]
3. Вернись к [[../Index|списку тем]] для выбора следующей темы
