(function() {
  var link = document.getElementById('navAdminLink');
  if (!link) return;
  try {
    if (localStorage.getItem('admin_token')) link.style.display = '';
  } catch (e) {
    link.style.display = 'none';
  }
})();