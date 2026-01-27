---
title: .NET Authentication — Аутентификация и авторизация
category: .NET
---

# .NET Authentication — Аутентификация и авторизация

**Навигация:** [[../README|← Topics]]

---

## 1. Основные концепции

### Authentication vs Authorization:
- **Authentication (Аутентификация)** - "Кто вы?" - процесс проверки личности пользователя
- **Authorization (Авторизация)** - "Что вы можете?" - процесс проверки прав доступа к ресурсам

### Основные компоненты:
- **Claims** - информация о пользователе (имя, роль, email)
- **Policies** - правила авторизации
- **Schemes** - схемы аутентификации (JWT, Cookie, OAuth)
- **Handlers** - обработчики аутентификации

## 2. JWT (JSON Web Token) аутентификация

### Настройка JWT:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Добавление аутентификации
    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = Configuration["Jwt:Issuer"],
                ValidAudience = Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(Configuration["Jwt:Key"]))
            };
        });
    
    // Добавление авторизации
    services.AddAuthorization();
    
    // Регистрация сервисов
    services.AddScoped<IAuthService, AuthService>();
    services.AddScoped<ITokenService, TokenService>();
}
```

### Генерация JWT токена:
```csharp
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    
    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("CustomClaim", "CustomValue")
        };
        
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
        
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(1),
            signingCredentials: credentials);
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public ClaimsPrincipal ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);
        
        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);
            
            return principal;
        }
        catch
        {
            return null;
        }
    }
}
```

### Контроллер аутентификации:
```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITokenService _tokenService;
    
    public AuthController(IAuthService authService, ITokenService tokenService)
    {
        _authService = authService;
        _tokenService = tokenService;
    }
    
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _authService.ValidateUserAsync(request.Username, request.Password);
        
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }
        
        var token = _tokenService.GenerateToken(user);
        
        return Ok(new
        {
            token = token,
            user = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                role = user.Role
            }
        });
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterUserAsync(request);
        
        if (!result.Success)
        {
            return BadRequest(new { message = result.ErrorMessage });
        }
        
        return Ok(new { message = "User registered successfully" });
    }
}
```

## 3. Claims и Policies

### Работа с Claims:
```csharp
public class UserController : ControllerBase
{
    [HttpGet("profile")]
    [Authorize] // Требует аутентификации
    public IActionResult GetProfile()
    {
        // Получение claims из токена
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        
        return Ok(new
        {
            userId = userId,
            username = username,
            email = email,
            role = role
        });
    }
    
    [HttpGet("admin-only")]
    [Authorize(Roles = "Admin")] // Требует роль Admin
    public IActionResult AdminOnly()
    {
        return Ok("This is admin only content");
    }
}
```

### Создание Policies:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthorization(options =>
    {
        // Policy для минимального возраста
        options.AddPolicy("MinimumAge", policy =>
            policy.RequireClaim("Age", "18", "19", "20", "21"));
        
        // Policy для определенной роли
        options.AddPolicy("AdminOnly", policy =>
            policy.RequireRole("Admin"));
        
        // Policy для комбинации требований
        options.AddPolicy("SeniorUser", policy =>
            policy.RequireRole("User")
                  .RequireClaim("Experience", "Senior"));
        
        // Policy с custom требованиями
        options.AddPolicy("CanEditPosts", policy =>
            policy.Requirements.Add(new CanEditPostsRequirement()));
    });
    
    // Регистрация handler для custom requirement
    services.AddScoped<IAuthorizationHandler, CanEditPostsHandler>();
}

// Custom requirement
public class CanEditPostsRequirement : IAuthorizationRequirement
{
    public string RequiredPermission { get; } = "EditPosts";
}

// Custom handler
public class CanEditPostsHandler : AuthorizationHandler<CanEditPostsRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        CanEditPostsRequirement requirement)
    {
        var user = context.User;
        
        // Проверка роли
        if (user.IsInRole("Admin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }
        
        // Проверка custom claim
        if (user.HasClaim("Permission", requirement.RequiredPermission))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }
        
        return Task.CompletedTask;
    }
}
```

### Использование Policies:
```csharp
[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    [HttpGet]
    [Authorize] // Любой аутентифицированный пользователь
    public IActionResult GetPosts()
    {
        return Ok("Posts list");
    }
    
    [HttpPost]
    [Authorize(Policy = "CanEditPosts")] // Custom policy
    public IActionResult CreatePost([FromBody] CreatePostRequest request)
    {
        return Ok("Post created");
    }
    
    [HttpPut("{id}")]
    [Authorize(Policy = "CanEditPosts")]
    public IActionResult UpdatePost(int id, [FromBody] UpdatePostRequest request)
    {
        return Ok($"Post {id} updated");
    }
    
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Только админы
    public IActionResult DeletePost(int id)
    {
        return Ok($"Post {id} deleted");
    }
}
```

## 4. Cookie аутентификация

### Настройка Cookie аутентификации:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
        .AddCookie(options =>
        {
            options.LoginPath = "/Account/Login";
            options.LogoutPath = "/Account/Logout";
            options.AccessDeniedPath = "/Account/AccessDenied";
            options.ExpireTimeSpan = TimeSpan.FromHours(1);
            options.SlidingExpiration = true;
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        });
}

public void Configure(IApplicationBuilder app)
{
    app.UseAuthentication();
    app.UseAuthorization();
}
```

### Контроллер для Cookie аутентификации:
```csharp
public class AccountController : Controller
{
    private readonly IAuthService _authService;
    
    public AccountController(IAuthService authService)
    {
        _authService = authService;
    }
    
    [HttpGet]
    public IActionResult Login()
    {
        return View();
    }
    
    [HttpPost]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }
        
        var user = await _authService.ValidateUserAsync(model.Username, model.Password);
        
        if (user == null)
        {
            ModelState.AddModelError("", "Invalid username or password");
            return View(model);
        }
        
        // Создание claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };
        
        // Создание identity
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        
        // Вход в систему
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        
        return RedirectToAction("Index", "Home");
    }
    
    [HttpPost]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Index", "Home");
    }
}
```

## 5. OAuth 2.0 и OpenID Connect

### Настройка Google OAuth:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddGoogle(options =>
    {
        options.ClientId = Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = Configuration["Authentication:Google:ClientSecret"];
    });
}
```

### Настройка Microsoft OAuth:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = MicrosoftAccountDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddMicrosoftAccount(options =>
    {
        options.ClientId = Configuration["Authentication:Microsoft:ClientId"];
        options.ClientSecret = Configuration["Authentication:Microsoft:ClientSecret"];
    });
}
```

## 6. Роли и права доступа

### Система ролей:
```csharp
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public List<Permission> Permissions { get; set; } = new List<Permission>();
}

public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Resource { get; set; }
    public string Action { get; set; }
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public List<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public User User { get; set; }
    public Role Role { get; set; }
}
```

### Сервис для работы с ролями:
```csharp
public interface IRoleService
{
    Task<bool> UserHasPermissionAsync(int userId, string resource, string action);
    Task<List<string>> GetUserRolesAsync(int userId);
    Task AssignRoleToUserAsync(int userId, int roleId);
    Task RemoveRoleFromUserAsync(int userId, int roleId);
}

public class RoleService : IRoleService
{
    private readonly ApplicationDbContext _context;
    
    public RoleService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<bool> UserHasPermissionAsync(int userId, string resource, string action)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user == null) return false;
        
        return user.UserRoles.Any(ur => 
            ur.Role.Permissions.Any(p => 
                p.Resource == resource && p.Action == action));
    }
    
    public async Task<List<string>> GetUserRolesAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        return user?.UserRoles.Select(ur => ur.Role.Name).ToList() ?? new List<string>();
    }
}
```

## 7. Middleware для аутентификации

### Custom middleware для проверки токенов:
```csharp
public class TokenValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ITokenService _tokenService;
    
    public TokenValidationMiddleware(RequestDelegate next, ITokenService tokenService)
    {
        _next = next;
        _tokenService = tokenService;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();
        
        if (token != null)
        {
            var principal = _tokenService.ValidateToken(token);
            if (principal != null)
            {
                context.User = principal;
            }
        }
        
        await _next(context);
    }
}
```

## 8. Тестирование аутентификации

### Unit тесты для аутентификации:
```csharp
[Test]
public async Task Login_WithValidCredentials_ShouldReturnToken()
{
    // Arrange
    var authService = new Mock<IAuthService>();
    var tokenService = new Mock<ITokenService>();
    var user = new User { Id = 1, Username = "test", Email = "test@example.com" };
    
    authService.Setup(x => x.ValidateUserAsync("test", "password"))
               .ReturnsAsync(user);
    
    tokenService.Setup(x => x.GenerateToken(user))
                .Returns("fake-jwt-token");
    
    var controller = new AuthController(authService.Object, tokenService.Object);
    
    // Act
    var result = await controller.Login(new LoginRequest 
    { 
        Username = "test", 
        Password = "password" 
    });
    
    // Assert
    Assert.IsInstanceOf<OkObjectResult>(result);
    var okResult = result as OkObjectResult;
    Assert.IsNotNull(okResult.Value);
}
```

## 9. Безопасность

### Рекомендации по безопасности:
```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                // Валидация подписи
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                
                // Валидация issuer и audience
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                
                // Валидация времени жизни
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero, // Убираем запас времени
                
                // Валидация алгоритма
                RequireExpirationTime = true,
                RequireSignedTokens = true
            };
            
            // Обработка событий
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    // Логирование ошибок аутентификации
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    // Дополнительная валидация токена
                    return Task.CompletedTask;
                }
            };
        });
}
```

## Практические задания:

1. **Реализуйте JWT аутентификацию** с refresh токенами
2. **Создайте систему ролей** с правами доступа
3. **Реализуйте OAuth** с Google или Microsoft
4. **Создайте middleware** для проверки API ключей

---

## 🔗 Навигация

← [[../README|Вернуться к списку тем]]

---

## 📖 Рекомендуемый порядок

1. Изучи теорию выше
2. Пройди [[quick_check|быстрый опросник]]
3. Вернись к [[../README|списку тем]] для выбора следующей темы
