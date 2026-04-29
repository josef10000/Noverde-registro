import firebase_admin
from firebase_admin import credentials, firestore, auth
import json

def force_setup():
    try:
        cred = credentials.Certificate('service-account.json')
        with open('firebase-applet-config.json', 'r') as f:
            client_config = json.load(f)
        database_id = client_config.get('firestoreDatabaseId')
        
        firebase_admin.initialize_app(cred)
        try:
            db = firestore.client(database=database_id)
        except:
            db = firestore.client()

        uid = "yan4TWHRHwNW68WInKwDhkUajSz2"
        email = "jfs102019@hotmail.com"
        team_id = "equipe_noverde_oficial"

        print(f"Forçando acesso para {email}...")

        # Grava Equipe
        db.collection('teams').document(team_id).set({
            "id": team_id,
            "name": "Noverde Oficial",
            "supervisorId": uid,
            "inviteToken": "convite_oficial_2026",
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        # Grava Perfil
        db.collection('users').document(uid).set({
            "uid": uid,
            "email": email,
            "displayName": "José Frazão",
            "role": "supervisor",
            "teamId": team_id,
            "managedTeams": [team_id],
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        print("SUCESSO! Dados gravados no banco nomeado.")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    force_setup()
