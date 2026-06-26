export async function POST(request) {
  try {
    const body = await request.json()
    
    const response = await fetch(process.env.NEXT_PUBLIC_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
    
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { status: 'error', message: '伺服器回應格式錯誤' }
    }
    
    return Response.json(data)
  } catch (err) {
    return Response.json({ status: 'error', message: err.message }, { status: 500 })
  }
}
