async function loadLinks() {
  const response = await fetch("/api/admin");
  const data = await response.json();

  document.getElementById("totalLinks").textContent = data.total_links;
  document.getElementById("totalClicks").textContent = data.total_clicks;
  document.getElementById("todayClicks").textContent = data.today_clicks;

  const table = document.getElementById("linksTable");
  table.innerHTML = "";

  data.links.forEach(link => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${link.code}</td>
      <td>${link.full_url}</td>
      <td>${link.clicks}</td>
      <td>${new Date(link.created_at).toLocaleDateString()}</td>
      <td class="actions">
        <button class="copy" onclick="copyLink('${link.short_url}')">Copy</button>
        <button class="delete" onclick="deleteLink('${link.code}')">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });
}

function copyLink(url) {
  navigator.clipboard.writeText(url);
}

async function deleteLink(code) {
  if (!confirm("Delete this link?")) return;

  await fetch(`/api/delete/${code}`, { method: "DELETE" });
  loadLinks();
}

loadLinks();
