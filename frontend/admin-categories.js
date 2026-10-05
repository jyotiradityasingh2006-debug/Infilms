// Portfolio categories: the filter buttons on the public portfolio page.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var adminCategories = document.getElementById('adminCategories');
  var categoryForm = document.getElementById('categoryForm');
  var categoryNameInput = document.getElementById('categoryNameInput');
  var addCatBtn = document.getElementById('addCatBtn');
  var categoryMsg = document.getElementById('categoryMsg');
  var categoryCount = document.getElementById('categoryCount');

  var categories = [];
  var photoCounts = {};

  function authHeaders(extra) {
    return Shell.authHeaders(extra);
  }

  function countFor(key) {
    return photoCounts[key] || 0;
  }

  function renderCategories() {
    if (categoryCount) {
      categoryCount.textContent = categories.length
        ? categories.length + (categories.length === 1 ? ' category' : ' categories')
        : 'No categories yet';
    }
    if (categories.length === 0) {
      adminCategories.innerHTML = '<p class="mini-empty">No categories yet. Add one above and it appears as a filter button on the portfolio page.</p>';
      return;
    }
    adminCategories.innerHTML = '';
    categories.forEach(function (c) {
      var row = document.createElement('div');
      row.className = 'setting-row';
      var count = countFor(c.key);
      row.innerHTML =
        '<div>' +
          '<div class="sr-label">' + Shell.esc(c.name) + '</div>' +
          '<div class="sr-note">' + count + (count === 1 ? ' photo' : ' photos') + ' · key: ' + Shell.esc(c.key) + '</div>' +
        '</div>' +
        '<div class="admin-testi-actions">' +
          '<button class="btn btn-edit" data-key="' + Shell.esc(c.key) + '">Rename</button>' +
          '<button class="btn btn-delete" data-key="' + Shell.esc(c.key) + '">Delete</button>' +
        '</div>';
      adminCategories.appendChild(row);
    });
    adminCategories.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', renameCategory);
    });
    adminCategories.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', deleteCategory);
    });
  }

  async function loadCategories() {
    try {
      var res = await window.apiFetch('/categories');
      var data = await res.json();
      categories = data.categories || [];
      renderCategories();
    } catch (err) {
      adminCategories.innerHTML = '<p class="mini-empty">Failed to load categories.</p>';
    }
  }

  // Photo counts come from the public media list, keyed by the category the
  // file was stored under.
  async function loadPhotoCounts() {
    try {
      var res = await window.apiFetch('/photos');
      var data = await res.json();
      photoCounts = {};
      (data.photos || []).forEach(function (p) {
        if (p.type === 'video') return;
        if (photoCounts[p.category] == null) photoCounts[p.category] = 0;
        photoCounts[p.category]++;
      });
      renderCategories();
    } catch (err) {
      // Counts are a nicety — the list still works without them.
    }
  }

  function renameCategory(e) {
    var btn = e.currentTarget;
    var key = btn.dataset.key;
    var cat = categories.find(function (c) { return c.key === key; });
    if (!cat) return;
    var name = prompt('New name for "' + cat.name + '":', cat.name);
    if (name == null) return;
    var trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;
    btn.disabled = true;
    updateCategoryName(key, trimmed, btn);
  }

  async function updateCategoryName(key, name, btn) {
    try {
      var res = await window.apiFetch('/categories/' + encodeURIComponent(key), {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: name }),
      });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Rename failed');
        btn.disabled = false;
        return;
      }
      loadCategories();
    } catch (err) {
      alert('Network error');
      btn.disabled = false;
    }
  }

  function deleteCategory(e) {
    var btn = e.currentTarget;
    var key = btn.dataset.key;
    var cat = categories.find(function (c) { return c.key === key; });
    if (!cat) return;
    if (!confirm('Delete the "' + cat.name + '" category? Photos already in it will stay in the gallery but will no longer have their own filter button.')) return;
    btn.disabled = true;
    removeCategory(key, btn);
  }

  async function removeCategory(key, btn) {
    try {
      var res = await window.apiFetch('/categories/' + encodeURIComponent(key), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        btn.disabled = false;
        return;
      }
      loadCategories();
      loadPhotoCounts();
    } catch (err) {
      alert('Network error');
      btn.disabled = false;
    }
  }

  categoryForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var name = categoryNameInput.value.trim();
    if (!name) return;
    addCatBtn.disabled = true;
    addCatBtn.textContent = 'Adding...';
    Shell.msg(categoryMsg, '', false);
    try {
      var res = await window.apiFetch('/categories', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: name }),
      });
      if (res.status === 401) {
        Shell.msg(categoryMsg, 'Session expired. Please log in again.', false);
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        Shell.msg(categoryMsg, data.message || 'Add failed', false);
        return;
      }
      categoryNameInput.value = '';
      Shell.msg(categoryMsg, 'Category "' + data.category.name + '" added.', true);
      loadCategories();
    } catch (err) {
      Shell.msg(categoryMsg, 'Network error', false);
    } finally {
      addCatBtn.disabled = false;
      addCatBtn.textContent = 'Add Category';
    }
  });

  loadCategories();
  loadPhotoCounts();
})();
