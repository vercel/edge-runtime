export async function serializeResponse(response: Response) {
  const text = await response.text()
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers),
    json: toJSON(text),
    text,
  }
}

function toJSON(value: string) {
  try {
    return JSON.parse(value)
  } catch (error) {
    return {}
  }
}
