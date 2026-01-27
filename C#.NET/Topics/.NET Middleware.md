# Middleware в ASP.NET Core - Теория

## 1. Что такое Middleware?

**Middleware** - это компоненты, которые формируют pipeline обработки HTTP запросов в ASP.NET Core. Каждый middleware может:
- Обрабатывать входящие запросы
- Обрабатывать исходящие ответы
- Вызывать следующий middleware в pipeline
- Завершать pipeline (short-circuiting)

### Архитектура pipeline:
```
Request → Middleware1 → Middleware2 → Middleware3 → Controller → Middleware3 → Middleware2 → Middleware1 → Response
```

## 2. Встроенные Middleware

### Основные middleware компоненты:
```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // 1. Exception Handling (должен быть первым)
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    else
    {
        app.UseExceptionHandler("/Error");
    }
    
    // 2. HTTPS Redirection
    app.UseHttpsRedirection();
    
    // 3. Static Files
    app.UseStaticFiles();
    
    // 4. Routing
    app.UseRouting();
    
    // 5. Authentication
    app.UseAuthentication();
    
    // 6. Authorization
    app.UseAuthorization();
    
    // 7. CORS
    app.UseCors();
    
    // 8. Endpoints
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

## 3. Создание собственного Middleware

### Классический подход:
```csharp
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    
    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        // Логирование входящего запроса
        _logger.LogInformation($"Request started: {context.Request.Method} {context.Request.Path}");
        
        try
        {
            // Вызов следующего middleware
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            
            // Логирование исходящего ответа
            _logger.LogInformation($"Request completed: {context.Request.Method} {context.Request.Path} " +
                                 $"Status: {context.Response.StatusCode} " +
                                 $"Duration: {stopwatch.ElapsedMilliseconds}ms");
        }
    }
}

// Регистрация middleware
public void Configure(IApplicationBuilder app)
{
    app.UseMiddleware<RequestLoggingMiddleware>();
    // или
    app.UseRequestLogging(); // Extension method
}
```

### Extension Method для регистрации:
```csharp
public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestLoggingMiddleware>();
    }
}
```

### Middleware с параметрами:
```csharp
public class CustomHeaderMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _headerName;
    private readonly string _headerValue;
    
    public CustomHeaderMiddleware(RequestDelegate next, string headerName, string headerValue)
    {
        _next = next;
        _headerName = headerName;
        _headerValue = headerValue;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Добавление заголовка к ответу
        context.Response.Headers.Add(_headerName, _headerValue);
        
        await _next(context);
    }
}

// Использование с параметрами
public void Configure(IApplicationBuilder app)
{
    app.UseMiddleware<CustomHeaderMiddleware>("X-Custom-Header", "MyValue");
}
```

## 4. Middleware с Dependency Injection

### Middleware с сервисами:
```csharp
public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiKeyMiddleware> _logger;
    
    public ApiKeyMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Проверка API ключа
        if (!context.Request.Headers.TryGetValue("X-API-Key", out var apiKey))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("API Key is required");
            return;
        }
        
        var validApiKey = _configuration["ApiKey"];
        if (apiKey != validApiKey)
        {
            _logger.LogWarning($"Invalid API key attempt from {context.Connection.RemoteIpAddress}");
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Invalid API Key");
            return;
        }
        
        await _next(context);
    }
}
```

### Scoped сервисы в middleware:
```csharp
public class UserContextMiddleware
{
    private readonly RequestDelegate _next;
    
    public UserContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context, IUserService userService)
    {
        // Получение пользователя из токена
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await userService.GetUserByIdAsync(userId);
            context.Items["CurrentUser"] = user;
        }
        
        await _next(context);
    }
}
```

## 5. Условный Middleware

### Middleware с условиями:
```csharp
public class ConditionalMiddleware
{
    private readonly RequestDelegate _next;
    private readonly RequestDelegate _branch;
    
    public ConditionalMiddleware(RequestDelegate next, RequestDelegate branch)
    {
        _next = next;
        _branch = branch;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Условие для выполнения branch
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            await _branch(context);
        }
        else
        {
            await _next(context);
        }
    }
}

// Использование
public void Configure(IApplicationBuilder app)
{
    app.MapWhen(context => context.Request.Path.StartsWithSegments("/api"), 
        apiApp =>
        {
            apiApp.UseMiddleware<ApiKeyMiddleware>();
            apiApp.UseRouting();
            apiApp.UseEndpoints(endpoints => endpoints.MapControllers());
        });
    
    app.UseRouting();
    app.UseEndpoints(endpoints => endpoints.MapRazorPages());
}
```

## 6. Middleware для обработки ошибок

### Глобальная обработка ошибок:
```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    
    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new
        {
            error = new
            {
                message = exception.Message,
                details = exception.ToString()
            }
        };
        
        switch (exception)
        {
            case ArgumentException _:
                context.Response.StatusCode = 400;
                break;
            case UnauthorizedAccessException _:
                context.Response.StatusCode = 401;
                break;
            case NotImplementedException _:
                context.Response.StatusCode = 501;
                break;
            default:
                context.Response.StatusCode = 500;
                break;
        }
        
        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}
```

## 7. Middleware для кэширования

### Кэширование ответов:
```csharp
public class ResponseCachingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ResponseCachingMiddleware> _logger;
    
    public ResponseCachingMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<ResponseCachingMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Генерация ключа кэша
        var cacheKey = GenerateCacheKey(context.Request);
        
        // Проверка кэша
        if (_cache.TryGetValue(cacheKey, out byte[] cachedResponse))
        {
            _logger.LogInformation($"Cache hit for {context.Request.Path}");
            
            context.Response.ContentType = "application/json";
            context.Response.ContentLength = cachedResponse.Length;
            await context.Response.Body.WriteAsync(cachedResponse);
            return;
        }
        
        // Сохранение оригинального потока ответа
        var originalBodyStream = context.Response.Body;
        
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;
        
        await _next(context);
        
        // Кэширование ответа
        if (context.Response.StatusCode == 200)
        {
            var responseBytes = responseBody.ToArray();
            _cache.Set(cacheKey, responseBytes, TimeSpan.FromMinutes(5));
            
            _logger.LogInformation($"Response cached for {context.Request.Path}");
        }
        
        // Возврат ответа клиенту
        responseBody.Seek(0, SeekOrigin.Begin);
        await responseBody.CopyToAsync(originalBodyStream);
    }
    
    private string GenerateCacheKey(HttpRequest request)
    {
        return $"{request.Method}:{request.Path}:{request.QueryString}";
    }
}
```

## 8. Middleware для метрик

### Сбор метрик производительности:
```csharp
public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMetrics _metrics;
    
    public MetricsMiddleware(RequestDelegate next, IMetrics metrics)
    {
        _next = next;
        _metrics = metrics;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            
            // Запись метрик
            _metrics.Measure.Timer.Time("http_request_duration", stopwatch.Elapsed);
            _metrics.Measure.Counter.Increment("http_requests_total", 
                new MetricTags("method", context.Request.Method, "status", context.Response.StatusCode.ToString()));
        }
    }
}
```

## 9. Тестирование Middleware

### Unit тесты для middleware:
```csharp
[Test]
public async Task RequestLoggingMiddleware_ShouldLogRequestAndResponse()
{
    // Arrange
    var logger = new Mock<ILogger<RequestLoggingMiddleware>>();
    var next = new Mock<RequestDelegate>();
    var context = new DefaultHttpContext();
    context.Request.Method = "GET";
    context.Request.Path = "/test";
    
    var middleware = new RequestLoggingMiddleware(next.Object, logger.Object);
    
    // Act
    await middleware.InvokeAsync(context);
    
    // Assert
    next.Verify(x => x(context), Times.Once);
    logger.Verify(
        x => x.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Request started")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception, string>>()),
        Times.Once);
}
```

## 10. Лучшие практики

### Порядок middleware:
```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // 1. Exception handling (первым)
    app.UseExceptionHandler("/Error");
    
    // 2. Security headers
    app.UseMiddleware<SecurityHeadersMiddleware>();
    
    // 3. HTTPS redirection
    app.UseHttpsRedirection();
    
    // 4. Static files
    app.UseStaticFiles();
    
    // 5. Routing
    app.UseRouting();
    
    // 6. CORS (перед authentication)
    app.UseCors();
    
    // 7. Authentication
    app.UseAuthentication();
    
    // 8. Authorization
    app.UseAuthorization();
    
    // 9. Custom middleware
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<UserContextMiddleware>();
    
    // 10. Endpoints (последним)
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

### Рекомендации:
- **Порядок важен** - middleware выполняются в порядке регистрации
- **Используйте DI** - внедряйте зависимости через конструктор
- **Обрабатывайте исключения** - используйте try-catch в middleware
- **Логируйте правильно** - используйте структурированное логирование
- **Тестируйте middleware** - создавайте unit тесты
- **Избегайте блокирующих операций** - используйте async/await

## Практические задания:

1. **Создайте middleware** для логирования времени выполнения запросов
2. **Реализуйте middleware** для проверки API ключей
3. **Создайте middleware** для глобальной обработки ошибок
4. **Реализуйте middleware** для кэширования ответов

## Ключевые моменты для собеседования:

- Понимание концепции middleware pipeline
- Знание порядка выполнения middleware
- Умение создавать собственные middleware
- Понимание работы с DI в middleware
- Знание встроенных middleware компонентов
