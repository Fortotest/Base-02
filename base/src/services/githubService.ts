export const pushDataToGithub = async (fileName: string, newProductsData: any) => {
  const token = localStorage.getItem('apsari_github_token');
  const repo = localStorage.getItem('apsari_github_repo');

  if (!token || !repo) {
    throw new Error('Token GitHub dan Repository harus diisi di Pengaturan.');
  }

  const filePath = `src/data/${fileName}`;
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  // 1. Get the current file SHA
  let sha;
  try {
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }
  } catch (error) {
    // If getting fails, it might be that the file doesn't exist yet
    console.log("File possibly not found, will create a new one.", error);
  }

  // 2. Encode content to Base64 (UTF-8 safe)
  const jsonString = JSON.stringify(newProductsData, null, 2);
  const base64Content = btoa(
    new Uint8Array(new TextEncoder().encode(jsonString)).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  // 3. Put the new file content
  const putResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Auto-update product from Admin UI',
      content: base64Content,
      sha: sha,
    }),
  });

  if (!putResponse.ok) {
    throw new Error(`Gagal menyimpan ke GitHub: ${putResponse.statusText}`);
  }

  return putResponse.json();
};
