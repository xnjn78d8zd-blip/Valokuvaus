import os
import base64
import json
import io

from flask import Flask, render_template, request, jsonify
import anthropic
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # 20 MB max upload

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

STYLE_NAMES = {
    'fashion': 'Muotivalokuvaus',
    'art': 'Taidevalokuvaus',
    'food': 'Ruokavalkuvaus',
    'documentary': 'Dokumentaarinen valokuvaus',
    'press': 'Lehtivalokuvaus',
}

# Stable system prompt — cached with cache_control so it's only tokenized once
# per 5-minute window even when many photos are critiqued in quick succession.
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

CRITIQUE_SCHEMA = {
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
        'grade',
        'grade_explanation',
        'technical_analysis',
        'composition_analysis',
        'style_feedback',
        'improvements',
        'overall_summary',
    ],
    'additionalProperties': False,
}

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
EXT_TO_TYPE = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
}


def _prepare_image(file_obj) -> tuple[bytes, str]:
    """Read, validate, resize and return (b64_bytes, media_type)."""
    raw = file_obj.read()
    media_type = file_obj.content_type or ''

    if media_type not in ALLOWED_TYPES:
        ext = os.path.splitext(file_obj.filename or '')[1].lower()
        media_type = EXT_TO_TYPE.get(ext, '')
    if media_type not in ALLOWED_TYPES:
        raise ValueError('Tuetut kuvaformaatit: JPEG, PNG, WebP, GIF')

    img = Image.open(io.BytesIO(raw))

    # Normalise colour mode
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
        media_type = 'image/jpeg'
    if img.mode == 'RGBA' and media_type != 'image/png':
        img = img.convert('RGB')
        media_type = 'image/jpeg'

    # Resize — keep within Anthropic's recommended 1568 px long edge
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


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/critique', methods=['POST'])
def critique():
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

    try:
        response = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=2048,
            system=[{
                'type': 'text',
                'text': SYSTEM_PROMPT,
                # Cache the stable professor persona — hits on subsequent requests
                # within the same 5-minute window at ~0.1× token cost.
                'cache_control': {'type': 'ephemeral'},
            }],
            output_config={
                'format': {
                    'type': 'json_schema',
                    'schema': CRITIQUE_SCHEMA,
                }
            },
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
        )
    except anthropic.APIError as exc:
        return jsonify({'error': f'API-virhe: {exc}'}), 500

    try:
        result = json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError):
        return jsonify({'error': 'Vastauksen käsittelyvirhe — yritä uudelleen'}), 500

    # Clamp grade to valid range just in case
    result['grade'] = max(1, min(10, int(result.get('grade', 5))))

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
