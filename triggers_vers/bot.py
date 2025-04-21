import requests

TOKEN = "7702521918:AAEqKPhpXfI10GgeS_re1ZYk0F60xU9XCdc"
CHAT_ID = 1018497673  

def send_message(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    params = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"  
    }
    response = requests.post(url, json=params).json()
    print("Ответ Telegram:", response)

send_message("🔔 *Тест успешен!* Бот готов к работе!")