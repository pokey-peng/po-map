export async function loadStaticFile(url: string, format: 'text' | 'json' = 'text') {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load static file: ${response.statusText}`)
  }
  return format === 'json' ? response.json() : response.text()
}
