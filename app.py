import os
import base64
import json
import io
import time

from flask import Flask, render_template, request, jsonify, make_response, Response, stream_with_context
import anthropic
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 40 * 1024 * 1024  # 40 MB — base64 JSON is ~33% larger

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

STYLE_NAMES = {
    'fashion': 'Muotivalokuvaus',
    'art': 'Taidevalokuvaus',
    'food': 'Ruokavalkuvaus',
    'documentary': 'Dokumentaarinen valokuvaus',
    'press': 'Lehtivalokuvaus',
}

SYSTEM_PROMPT = """Olet kokenut valokuvaustaiteen professori ja kansainvälinen tuomari, jolla on yli 30 vuoden kokemus kaikista valokuvauksen lajeista. Arvioit valokuvia opettajan silmin — kriittisesti mutta rakentavasti, kuten oikeassa oppilaitoksen kritiikkisessiossa.

Arvioit aina seuraavat osa-alueet:
- Tekniikka: valotus, tarkennus, syväterävyys, terävyys, kohina
- Valaistus: laatu, suunta, värilämpötila, varjot ja valot
- Sommittelu: kultainen leikkaus/kolmanneksien sääntö, johtavat linjat, kehystys, tasapaino, negatiivinen tila
- Väri tai sävy: väriharmonia, kontrasti, jälkikäsittelytyyli
- Genrespesifiset kriteerit
- Luova visio ja taiteellinen intentio
- Emotionaalinen vaikutus ja tarinankerronta

Vastauksesi on AINA suomeksi. Kaikki teksti on suomeksi.

Olet rehellinen ja suora, mutta aina kannustava. Anna arvosana-asteikolla 1–10:
1–3 = Aloittelijan työ, vakavia teknisiä tai taiteellisia puutteita
4–5 = Kehittyvä, perusasiat hallussa mutta selviä parannuksen paikkoja
6–7 = Hyvä, ammattimainen taso tai lähellä sitä
8–9 = Erinomainen, julkaisukelpoinen työ
10 = Mestariteos, poikkeuksellinen saavutus"""

# Tool-based structured output — more compatible than output_config across SDK versions
CRITIQUE_TOOL = {
    'name': 'submit_critique',
    'description': 'Lähetä valokuvan arvostelu strukturoitussa muodossa',
    'input_schema': {
        'type': 'object',
        'properties': {
            'grade': {
                'type': 'integer',
                'description': 'Arvosana 1 (erittäin heikko) – 10 (mestariteos)',
            },
            'grade_explanation': {
                'type': 'string',
                'description': '2–3 lausetta siitä, miksi juuri tämä arvosana annettiin',
            },
            'technical_analysis': {
                'type': 'string',
                'description': 'Yksityiskohtainen tekninen analyysi: valotus, tarkennus, valaistus, kohina, värit',
            },
            'composition_analysis': {
                'type': 'string',
                'description': 'Sommitteluanalyysi: asettelu, linjat, kehystys, tilankäyttö, tasapaino',
            },
            'style_feedback': {
                'type': 'string',
                'description': 'Genrespesifinen palaute valitun valokuvauslajin konventioiden ja standardien mukaan',
            },
            'improvements': {
                'type': 'array',
                'items': {'type': 'string'},
                'description': '4–6 konkreettista, toteutettavaa parannusehdotusta',
            },
            'overall_summary': {
                'type': 'string',
                'description': 'Kokonaisarvio 2–3 lauseessa: vahvuudet ja tärkeimmät kehityskohteet',
            },
        },
        'required': [
            'grade', 'grade_explanation', 'technical_analysis',
            'composition_analysis', 'style_feedback', 'improvements', 'overall_summary',
        ],
    },
}

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
EXT_TO_TYPE = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
}


def _prepare_image(file_obj) -> tuple[bytes, str]:
    raw = file_obj.read()
    media_type = file_obj.content_type or ''

    if media_type not in ALLOWED_TYPES:
        ext = os.path.splitext(file_obj.filename or '')[1].lower()
        media_type = EXT_TO_TYPE.get(ext, '')
    if media_type not in ALLOWED_TYPES:
        raise ValueError('Tuetut kuvaformaatit: JPEG, PNG, WebP, GIF')

    return _prepare_image_bytes(raw, media_type)


def _prepare_image_bytes(raw: bytes, media_type: str) -> tuple[bytes, str]:
    img = Image.open(io.BytesIO(raw))
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
        media_type = 'image/jpeg'
    if img.mode == 'RGBA' and media_type != 'image/png':
        img = img.convert('RGB')
        media_type = 'image/jpeg'
    max_dim = 1568
    if max(img.width, img.height) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    if media_type == 'image/png':
        img.save(buf, format='PNG', optimize=True)
    else:
        img.save(buf, format='JPEG', quality=85, optimize=True)
        media_type = 'image/jpeg'
    return buf.getvalue(), media_type


# Return JSON for all error responses so the client always gets parseable data
@app.errorhandler(413)
def too_large(_):
    return jsonify({'error': 'Kuva on liian suuri — pienennä alle 20 MB'}), 413

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': f'Palvelinvirhe: {e}'}), 500

@app.errorhandler(Exception)
def unhandled(e):
    return jsonify({'error': f'Odottamaton virhe: {e}'}), 500


@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'has_api_key': bool(os.environ.get('ANTHROPIC_API_KEY')),
    })


@app.route('/')
def index():
    resp = make_response(render_template('index.html'))
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return resp


@app.route('/critique', methods=['POST'])
def critique():
    try:
        # Accept both JSON (base64) and multipart/form-data
        if request.is_json:
            body = request.get_json(force=True, silent=True) or {}
            description = (body.get('description') or '').strip()
            style = body.get('style', 'art')
            photo_b64_raw = body.get('photo_b64', '')
            media_type = body.get('photo_type', 'image/jpeg')

            if not photo_b64_raw:
                return jsonify({'error': 'Kuvaa ei ladattu'}), 400
            if not description:
                return jsonify({'error': 'Lisää kuvaus kuvasta ennen arviointia'}), 400
            if media_type not in ALLOWED_TYPES:
                media_type = 'image/jpeg'

            try:
                raw = base64.b64decode(photo_b64_raw)
                image_data, media_type = _prepare_image_bytes(raw, media_type)
            except Exception as exc:
                return jsonify({'error': f'Kuvan käsittelyvirhe: {exc}'}), 400

        else:
            if 'photo' not in request.files:
                return jsonify({'error': 'Kuvaa ei ladattu'}), 400

            photo = request.files['photo']
            description = request.form.get('description', '').strip()
            style = request.form.get('style', 'art')

            if not photo.filename:
                return jsonify({'error': 'Kuvaa ei valittu'}), 400
            if not description:
                return jsonify({'error': 'Lisää kuvaus kuvasta ennen arviointia'}), 400

            try:
                image_data, media_type = _prepare_image(photo)
            except ValueError as exc:
                return jsonify({'error': str(exc)}), 400
            except Exception as exc:
                return jsonify({'error': f'Kuvan käsittelyvirhe: {exc}'}), 400

        image_b64 = base64.standard_b64encode(image_data).decode('utf-8')
        style_name = STYLE_NAMES.get(style, 'Valokuvaus')

        user_message = (
            f'Arvioi tämä {style_name.lower()}-kuva.\n\n'
            f'Kuvaajan oma kuvaus: "{description}"\n\n'
            f'Anna ammattitaitoinen, yksityiskohtainen arvostelu {style_name.lower()} '
            f'genren vaatimusten ja standardien mukaan. Muista: vastaa yksinomaan suomeksi.'
        )

        def generate():
            # Send keepalive immediately so the proxy doesn't time out
            yield 'data: {"type":"keepalive"}\n\n'
            try:
                with client.messages.stream(
                    model='claude-sonnet-4-6',
                    max_tokens=2048,
                    system=[{
                        'type': 'text',
                        'text': SYSTEM_PROMPT,
                        'cache_control': {'type': 'ephemeral'},
                    }],
                    tools=[CRITIQUE_TOOL],
                    tool_choice={'type': 'tool', 'name': 'submit_critique'},
                    messages=[{
                        'role': 'user',
                        'content': [
                            {
                                'type': 'image',
                                'source': {
                                    'type': 'base64',
                                    'media_type': media_type,
                                    'data': image_b64,
                                },
                            },
                            {'type': 'text', 'text': user_message},
                        ],
                    }],
                ) as stream:
                    last_hb = time.monotonic()
                    for _ in stream:
                        if time.monotonic() - last_hb >= 4:
                            yield 'data: {"type":"keepalive"}\n\n'
                            last_hb = time.monotonic()
                    response = stream.get_final_message()

                tool_block = next(b for b in response.content if b.type == 'tool_use')
                result = tool_block.input
                result['grade'] = max(1, min(10, int(result.get('grade', 5))))
                result['type'] = 'result'
                yield f'data: {json.dumps(result, ensure_ascii=False)}\n\n'

            except anthropic.APIError as exc:
                yield f'data: {json.dumps({"type": "error", "error": f"API-virhe: {exc}"})}\n\n'
            except Exception as exc:
                yield f'data: {json.dumps({"type": "error", "error": f"Virhe: {type(exc).__name__}: {exc}"})}\n\n'

        return Response(
            stream_with_context(generate()),
            content_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
                'Connection': 'keep-alive',
            },
        )

    except Exception as exc:
        return jsonify({'error': f'Virhe: {type(exc).__name__}: {exc}'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
