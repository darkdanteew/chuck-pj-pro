export async function fetchCNPJ(cnpj: string) {
  const clean = cnpj.replace(/\D/g, "");

  if (clean.length !== 14) {
    throw new Error("CNPJ inválido");
  }

  const url = `https://brasilapi.com.br/api/cnpj/v1/${clean}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "ChuckPJPRO/1.0" },
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("CNPJ não encontrado");
    throw new Error(`Erro ao consultar CNPJ: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
