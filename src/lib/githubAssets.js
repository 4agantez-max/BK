const repository = "4agantez-max/BK";
const branch = "main";
const folders = {
  images: "public/uploads/images",
  apps: "public/uploads/apps",
};
const extensions = {
  images: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  apps: [".apk"],
};

export async function fetchGitHubAssets(category) {
  const folder = folders[category];
  if (!folder) throw new Error("Kategori file GitHub tidak dikenal.");

  const url = new URL(`https://api.github.com/repos/${repository}/contents/${folder}`);
  url.searchParams.set("ref", branch);
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (response.status === 404) {
    throw new Error("Folder tidak ditemukan. Pastikan folder dan file sudah ada di branch main.");
  }
  if (response.status === 403) {
    throw new Error("GitHub membatasi permintaan sementara. Coba lagi beberapa saat.");
  }
  if (!response.ok) throw new Error(`Daftar file GitHub gagal dimuat (HTTP ${response.status}).`);

  const entries = await response.json();
  if (!Array.isArray(entries)) throw new Error("GitHub tidak mengembalikan daftar file.");
  return entries
    .filter((entry) => entry.type === "file" && entry.download_url
      && extensions[category].some((extension) => entry.name.toLowerCase().endsWith(extension)))
    .map((entry) => ({
      name: entry.name,
      url: entry.download_url,
      size: Number(entry.size) || 0,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
