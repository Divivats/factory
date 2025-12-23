using FactoryMonitoringWeb.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FactoryMonitoringWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly FactoryDbContext _context;
        private readonly ILogger<HomeController> _logger;

        public HomeController(FactoryDbContext context, ILogger<HomeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IActionResult> Index(string? version = null, string viewMode = "cards")
        {
            // Load distinct versions for sidebar
            var versions = await _context.FactoryPCs
                .Select(p => p.ModelVersion)
                .Distinct()
                .OrderBy(v => v)
                .ToListAsync();

            // Load distinct line numbers for model management
            var lineNumbers = await _context.FactoryPCs
                .Select(p => p.LineNumber)
                .Distinct()
                .OrderBy(l => l)
                .ToListAsync();

            // Base query for PCs
            var query = _context.FactoryPCs
                .Include(p => p.Models)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(version) && versions.Contains(version))
            {
                query = query.Where(p => p.ModelVersion == version);
            }

            var pcs = await query
                .OrderBy(p => p.LineNumber)
                .ThenBy(p => p.PCNumber)
                .ToListAsync();

            var model = new Models.DashboardViewModel
            {
                Versions = versions,
                SelectedVersion = string.IsNullOrWhiteSpace(version) ? null : version,
                ViewMode = string.IsNullOrWhiteSpace(viewMode) ? "cards" : viewMode.ToLowerInvariant(),
                PCs = pcs,
                LineNumbers = lineNumbers
            };

            return View(model);
        }

        public async Task<IActionResult> ShowAll()
        {
            var pcs = await _context.FactoryPCs
                .Include(p => p.Models)
                .OrderBy(p => p.LineNumber)
                .ThenBy(p => p.PCNumber)
                .ToListAsync();

            return View(pcs);
        }

        public IActionResult Error()
        {
            return View();
        }
    }
}
