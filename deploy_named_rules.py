import json
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

def deploy_rules_to_named_db():
    print("Iniciando deploy de regras para o banco nomeado...")
    
    # 1. Carrega as credenciais
    with open('service-account.json', 'r') as f:
        sa_info = json.load(f)
    
    # 2. Carrega o ID do banco nomeado
    with open('firebase-applet-config.json', 'r') as f:
        config = json.load(f)
    database_id = config.get('firestoreDatabaseId')
    project_id = sa_info['project_id']
    
    print(f"Projeto: {project_id}")
    print(f"Banco de Dados: {database_id}")

    # 3. Obtém Token
    scopes = ['https://www.googleapis.com/auth/cloud-platform']
    creds = service_account.Credentials.from_service_account_info(sa_info, scopes=scopes)
    creds.refresh(Request())
    token = creds.token
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 4. Conteúdo das regras
    rules_content = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}"""

    # 5. Criar Ruleset
    print("Criando novo ruleset...")
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
        print(f"Erro ao criar ruleset: {ruleset_res.text}")
        return

    ruleset_name = ruleset_res.json()['name']
    print(f"Ruleset criado: {ruleset_name}")

    # 6. Atualizar Release do banco específico
    # Para o Firebase, o release de um banco nomeado segue o padrão: cloud.firestore/ID_DO_BANCO
    release_name = f"cloud.firestore/{database_id}"
    release_url = f"https://firebaserules.googleapis.com/v1/projects/{project_id}/releases/{release_name}"
    
    print(f"Atualizando release {release_name}...")
    release_payload = {
        "release": {
            "name": f"projects/{project_id}/releases/{release_name}",
            "rulesetName": ruleset_name
        }
    }
    
    # O método PATCH exige que o campo seja especificado no corpo e na URL
    res = requests.patch(
        f"{release_url}?updateMask=rulesetName",
        json=release_payload["release"],
        headers=headers
    )

    if res.status_code == 200:
        print("--- REGRAS APLICADAS COM SUCESSO NO BANCO NOMEADO! ---")
        print("Aguarde 30 segundos para a propagação do Google e tente novamente no site.")
    else:
        print(f"Erro ao atualizar release: {res.text}")

if __name__ == "__main__":
    deploy_rules_to_named_db()
