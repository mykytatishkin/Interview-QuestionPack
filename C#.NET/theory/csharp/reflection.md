# Рефлексия в C# - Теория

## 1. Что такое рефлексия?

**Рефлексия** - это способность программы получать информацию о типах, свойствах, методах и других элементах кода во время выполнения (runtime), а также создавать и вызывать их динамически.

### Основные возможности:
- Получение информации о типах
- Создание экземпляров классов
- Вызов методов и свойств
- Работа с атрибутами
- Динамическое создание типов

## 2. Основные классы рефлексии

### Type - информация о типе:
```csharp
// Получение типа различными способами
Type type1 = typeof(string);
Type type2 = "Hello".GetType();
Type type3 = Type.GetType("System.String");

// Информация о типе
Console.WriteLine($"Name: {type1.Name}");
Console.WriteLine($"FullName: {type1.FullName}");
Console.WriteLine($"IsClass: {type1.IsClass}");
Console.WriteLine($"IsValueType: {type1.IsValueType}");
```

### Assembly - информация о сборке:
```csharp
// Получение текущей сборки
Assembly assembly = Assembly.GetExecutingAssembly();

// Получение всех типов в сборке
Type[] types = assembly.GetTypes();

// Получение типа по имени
Type userType = assembly.GetType("MyNamespace.User");
```

## 3. Работа с типами

### Получение информации о типе:
```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    
    public void DisplayInfo()
    {
        Console.WriteLine($"User: {Name} ({Email})");
    }
    
    private void ValidateEmail()
    {
        // Приватный метод
    }
}

// Использование рефлексии
Type userType = typeof(User);

// Получение свойств
PropertyInfo[] properties = userType.GetProperties();
foreach (var prop in properties)
{
    Console.WriteLine($"Property: {prop.Name}, Type: {prop.PropertyType}");
}

// Получение методов
MethodInfo[] methods = userType.GetMethods();
foreach (var method in methods)
{
    Console.WriteLine($"Method: {method.Name}, ReturnType: {method.ReturnType}");
}

// Получение приватных членов
MethodInfo privateMethod = userType.GetMethod("ValidateEmail", 
    BindingFlags.NonPublic | BindingFlags.Instance);
```

## 4. Создание экземпляров

### Создание объектов через рефлексию:
```csharp
// Создание экземпляра через Activator
User user1 = (User)Activator.CreateInstance(typeof(User));

// Создание с параметрами
User user2 = (User)Activator.CreateInstance(typeof(User), 
    new object[] { 1, "John", "john@example.com" });

// Создание через конструктор
ConstructorInfo constructor = typeof(User).GetConstructor(new Type[] { });
User user3 = (User)constructor.Invoke(new object[] { });

// Создание generic типа
Type listType = typeof(List<>);
Type stringListType = listType.MakeGenericType(typeof(string));
object stringList = Activator.CreateInstance(stringListType);
```

## 5. Вызов методов и свойств

### Работа с методами:
```csharp
User user = new User { Id = 1, Name = "John", Email = "john@example.com" };
Type userType = typeof(User);

// Вызов публичного метода
MethodInfo displayMethod = userType.GetMethod("DisplayInfo");
displayMethod.Invoke(user, null);

// Вызов приватного метода
MethodInfo validateMethod = userType.GetMethod("ValidateEmail", 
    BindingFlags.NonPublic | BindingFlags.Instance);
validateMethod.Invoke(user, null);
```

### Работа со свойствами:
```csharp
User user = new User();
Type userType = typeof(User);

// Установка значения свойства
PropertyInfo nameProperty = userType.GetProperty("Name");
nameProperty.SetValue(user, "Jane");

// Получение значения свойства
string name = (string)nameProperty.GetValue(user);
Console.WriteLine($"Name: {name}");

// Работа с индексаторами
PropertyInfo indexer = userType.GetProperty("Item");
if (indexer != null)
{
    indexer.SetValue(user, "value", new object[] { "key" });
}
```

## 6. Работа с атрибутами

### Создание custom атрибута:
```csharp
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class RequiredAttribute : Attribute
{
    public string ErrorMessage { get; set; }
    
    public RequiredAttribute(string errorMessage = "Field is required")
    {
        ErrorMessage = errorMessage;
    }
}

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class EmailAttribute : Attribute
{
    public string ErrorMessage { get; set; }
    
    public EmailAttribute(string errorMessage = "Invalid email format")
    {
        ErrorMessage = errorMessage;
    }
}

// Использование атрибутов
public class User
{
    [Required("Name is required")]
    public string Name { get; set; }
    
    [Required("Email is required")]
    [Email("Invalid email format")]
    public string Email { get; set; }
    
    public int Age { get; set; }
}
```

### Система валидации через рефлексию:
```csharp
public class Validator
{
    public static List<string> Validate(object obj)
    {
        var errors = new List<string>();
        Type type = obj.GetType();
        
        // Получение всех свойств
        PropertyInfo[] properties = type.GetProperties();
        
        foreach (var property in properties)
        {
            // Проверка Required атрибута
            var requiredAttr = property.GetCustomAttribute<RequiredAttribute>();
            if (requiredAttr != null)
            {
                var value = property.GetValue(obj);
                if (value == null || string.IsNullOrEmpty(value.ToString()))
                {
                    errors.Add(requiredAttr.ErrorMessage);
                }
            }
            
            // Проверка Email атрибута
            var emailAttr = property.GetCustomAttribute<EmailAttribute>();
            if (emailAttr != null)
            {
                var value = property.GetValue(obj)?.ToString();
                if (!string.IsNullOrEmpty(value) && !IsValidEmail(value))
                {
                    errors.Add(emailAttr.ErrorMessage);
                }
            }
        }
        
        return errors;
    }
    
    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}

// Использование
User user = new User { Name = "", Email = "invalid-email" };
var errors = Validator.Validate(user);
foreach (var error in errors)
{
    Console.WriteLine(error);
}
```

## 7. Динамическое создание типов

### Создание типа во время выполнения:
```csharp
public class DynamicTypeBuilder
{
    public static Type CreateUserType()
    {
        // Создание сборки
        AssemblyName assemblyName = new AssemblyName("DynamicAssembly");
        AssemblyBuilder assemblyBuilder = AssemblyBuilder.DefineDynamicAssembly(
            assemblyName, AssemblyBuilderAccess.Run);
        
        // Создание модуля
        ModuleBuilder moduleBuilder = assemblyBuilder.DefineDynamicModule("DynamicModule");
        
        // Создание типа
        TypeBuilder typeBuilder = moduleBuilder.DefineType("DynamicUser", 
            TypeAttributes.Public | TypeAttributes.Class);
        
        // Добавление поля
        FieldBuilder fieldBuilder = typeBuilder.DefineField("_name", 
            typeof(string), FieldAttributes.Private);
        
        // Добавление свойства
        PropertyBuilder propertyBuilder = typeBuilder.DefineProperty("Name", 
            PropertyAttributes.HasDefault, typeof(string), null);
        
        // Добавление getter
        MethodBuilder getMethodBuilder = typeBuilder.DefineMethod("get_Name",
            MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig,
            typeof(string), Type.EmptyTypes);
        
        ILGenerator getIL = getMethodBuilder.GetILGenerator();
        getIL.Emit(OpCodes.Ldarg_0);
        getIL.Emit(OpCodes.Ldfld, fieldBuilder);
        getIL.Emit(OpCodes.Ret);
        
        // Добавление setter
        MethodBuilder setMethodBuilder = typeBuilder.DefineMethod("set_Name",
            MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig,
            null, new Type[] { typeof(string) });
        
        ILGenerator setIL = setMethodBuilder.GetILGenerator();
        setIL.Emit(OpCodes.Ldarg_0);
        setIL.Emit(OpCodes.Ldarg_1);
        setIL.Emit(OpCodes.Stfld, fieldBuilder);
        setIL.Emit(OpCodes.Ret);
        
        propertyBuilder.SetGetMethod(getMethodBuilder);
        propertyBuilder.SetSetMethod(setMethodBuilder);
        
        // Создание типа
        return typeBuilder.CreateType();
    }
}
```

## 8. Практические примеры

### ORM через рефлексию:
```csharp
public class SimpleORM
{
    public static string GenerateSelectQuery<T>()
    {
        Type type = typeof(T);
        string tableName = type.Name;
        
        // Получение всех свойств
        PropertyInfo[] properties = type.GetProperties();
        string[] columnNames = properties.Select(p => p.Name).ToArray();
        
        return $"SELECT {string.Join(", ", columnNames)} FROM {tableName}";
    }
    
    public static T MapToObject<T>(IDataReader reader) where T : new()
    {
        T obj = new T();
        Type type = typeof(T);
        
        // Получение всех свойств
        PropertyInfo[] properties = type.GetProperties();
        
        for (int i = 0; i < reader.FieldCount; i++)
        {
            string columnName = reader.GetName(i);
            PropertyInfo property = properties.FirstOrDefault(p => 
                p.Name.Equals(columnName, StringComparison.OrdinalIgnoreCase));
            
            if (property != null && property.CanWrite)
            {
                object value = reader.GetValue(i);
                if (value != DBNull.Value)
                {
                    property.SetValue(obj, value);
                }
            }
        }
        
        return obj;
    }
}

// Использование
string query = SimpleORM.GenerateSelectQuery<User>();
// Результат: SELECT Id, Name, Email FROM User
```

### Сериализация через рефлексию:
```csharp
public class SimpleSerializer
{
    public static string Serialize(object obj)
    {
        Type type = obj.GetType();
        var properties = type.GetProperties();
        
        var result = new StringBuilder();
        result.Append("{");
        
        for (int i = 0; i < properties.Length; i++)
        {
            var property = properties[i];
            var value = property.GetValue(obj);
            
            result.Append($"\"{property.Name}\":");
            
            if (value is string)
            {
                result.Append($"\"{value}\"");
            }
            else if (value is null)
            {
                result.Append("null");
            }
            else
            {
                result.Append(value);
            }
            
            if (i < properties.Length - 1)
            {
                result.Append(",");
            }
        }
        
        result.Append("}");
        return result.ToString();
    }
    
    public static T Deserialize<T>(string json) where T : new()
    {
        // Упрощенная десериализация
        T obj = new T();
        Type type = typeof(T);
        
        // Парсинг JSON (упрощенный)
        // В реальном проекте используйте Newtonsoft.Json или System.Text.Json
        
        return obj;
    }
}
```

## 9. Производительность и ограничения

### Проблемы производительности:
```csharp
// Медленно - рефлексия
MethodInfo method = typeof(User).GetMethod("DisplayInfo");
method.Invoke(user, null);

// Быстро - прямой вызов
user.DisplayInfo();

// Компромисс - кэширование
private static readonly Dictionary<Type, MethodInfo> _methodCache = new();

public static void CallMethodCached(object obj, string methodName)
{
    Type type = obj.GetType();
    
    if (!_methodCache.TryGetValue(type, out MethodInfo method))
    {
        method = type.GetMethod(methodName);
        _methodCache[type] = method;
    }
    
    method.Invoke(obj, null);
}
```

### Ограничения:
- Медленная производительность
- Нет type safety во время компиляции
- Сложность отладки
- Ограничения в некоторых сценариях (например, в AOT компиляции)

## 10. Альтернативы рефлексии

### Expression Trees:
```csharp
// Вместо рефлексии
PropertyInfo property = typeof(User).GetProperty("Name");
property.SetValue(user, "John");

// Используйте Expression Trees
Expression<Func<User, string>> nameSelector = u => u.Name;
var compiled = nameSelector.Compile();
string name = compiled(user);
```

### Source Generators (C# 9.0+):
```csharp
// Автоматическая генерация кода во время компиляции
// Вместо рефлексии во время выполнения
```

## Практические задания:

1. **Создайте систему валидации** используя атрибуты и рефлексию
2. **Реализуйте простой ORM** для маппинга объектов в SQL
3. **Создайте generic репозиторий** с использованием рефлексии
4. **Реализуйте сериализатор** для объектов в JSON

## Ключевые моменты для собеседования:

- Понимание что такое рефлексия и когда ее использовать
- Знание основных классов: Type, Assembly, PropertyInfo, MethodInfo
- Умение работать с атрибутами через рефлексию
- Понимание проблем производительности
- Знание альтернатив рефлексии
