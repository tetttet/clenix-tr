#!/usr/bin/env python3
"""Read bot updates privately; print only operational chat/topic identifiers."""
import getpass
import json
import urllib.request
import urllib.error

token = getpass.getpass('Telegram bot token (hidden): ').strip()
try:
    with urllib.request.urlopen(f'https://api.telegram.org/bot{token}/getUpdates', timeout=15) as response:
        result = json.load(response)
    if not result.get('ok'):
        raise ValueError('Telegram rejected the request')
    seen = set()
    for update in result.get('result', []):
        message = update.get('message', {})
        chat = message.get('chat', {})
        identity = (chat.get('id'), message.get('message_thread_id'))
        if identity[0] is not None and identity not in seen:
            seen.add(identity)
            print(json.dumps({'chat_id': identity[0], 'type': chat.get('type'), 'title': chat.get('title'), 'message_thread_id': identity[1]}, ensure_ascii=False))
    if not seen:
        print('No chat IDs found. Send /start to the bot or a group command, then retry.')
except (urllib.error.URLError, ValueError, TimeoutError):
    print('Unable to retrieve updates. Check credentials, connectivity, and whether a webhook is configured. No token or upstream details were printed.')
