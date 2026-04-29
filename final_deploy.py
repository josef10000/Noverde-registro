import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

def final_attempt_deploy():
    print("Iniciando tentativa final de deploy de regras...")
    
    with open('service-account.json', 'r') as f:
        sa_info = json.load(f)
    with open('firebase-applet-config.json', 'r') as f:
        config = json.load(f)
        
    database_id = config.get('firestoreDatabaseId')
    project_id = sa_info['project_id']
    
    scopes = ['https://www.googleapis.com/auth/cloud-platform']
    creds = service_account.Credentials.from_service_account_info(sa_info, scopes=scopes)
    creds.refresh(Request())
    token = creds.token
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. Conteúdo das regras
    rules_content = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}"""

    # 2. Criar Ruleset
    ruleset_payload = {
        "source": {
            "files": [{"name": "firestore.rules", "content": rules_content}]
        }
    }
    ruleset_res = requests.post(
        f"https://firebaserules.googleapis.com/v1/projects/{project_id}/rulesets",
        json=ruleset_payload,
        headers=headers
    )
    
    if ruleset_res.status_code != 200:
        print(f"Erro no ruleset: {ruleset_res.text}")
        return

    ruleset_name = ruleset_res.json()['name']
    
    # 3. Atualizar Release (Tentativa com estrutura simplificada)
    release_name = f"cloud.firestore/{database_id}"
    # O Google às vezes espera o payload sem o 'release' no topo
    payload = {
        "rulesetName": ruleset_name
    }
    
    url = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/releases/{release_name}?updateMask=rulesetName"
    
    print(f"Enviando PATCH para {url}...")
    res = requests.patch(url, json=payload, headers=headers)

    if res.status_code == 200:
        print("--- CONSEGUI! REGRAS APLICADAS PELO PYTHON! ---")
    else:
        print(f"O Google ainda está recusando: {res.status_code}")
        print(res.text)
        print("\nMOTIVO: Parece que seu projeto exige permissão manual de proprietário no Console.")

if __name__ == "__main__":
    final_attempt_deploy()
