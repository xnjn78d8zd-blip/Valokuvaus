import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// PDF-export Playwrightilla. Vaatii Chromium/Chrome-binäärin:
//   PDF_CHROME_PATH=/polku/chromeen  TAI  npx playwright install chromium
// Ilman binääriä palautetaan 501 ja käyttöliittymä ohjaa selaimen printtiin.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const landscape = req.nextUrl.searchParams.get('landscape') === '1'
  if (!url || !url.startsWith('/print/')) {
    return NextResponse.json({ error: 'Virheellinen printti-URL' }, { status: 400 })
  }
  try {
    const { chromium } = await import('playwright-core')
    const executablePath =
      process.env.PDF_CHROME_PATH ||
      process.env.PLAYWRIGHT_CHROMIUM_PATH ||
      undefined
    const browser = await chromium.launch({
      executablePath,
      channel: executablePath ? undefined : 'chrome',
    })
    const page = await browser.newPage()
    const origin = req.nextUrl.origin
    await page.goto(origin + url, { waitUntil: 'networkidle' })
    const pdf = await page.pdf({
      format: 'A4',
      landscape,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    await browser.close()
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tuotekortti.pdf"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          'PDF-moottoria ei löytynyt. Aseta PDF_CHROME_PATH .env-tiedostoon tai aja "npx playwright install chromium". ' +
          'Voit aina tulostaa PDF:n myös selaimen Tulosta-toiminnolla printtinäkymästä.',
        detail: String(err),
      },
      { status: 501 },
    )
  }
}
