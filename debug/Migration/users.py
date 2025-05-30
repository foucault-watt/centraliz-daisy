import json
import os
from pathlib import Path
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

# Configuration Supabase depuis les variables d'environnement
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def check_environment():
    """Vérifie que les variables d'environnement sont configurées"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Erreur: Variables d'environnement manquantes")
        print("💡 Assurez-vous que le fichier .env existe avec:")
        print("   SUPABASE_URL=votre_url_supabase")
        print("   SUPABASE_KEY=votre_clé_supabase")
        return False
    return True

def load_users_from_json():
    """Charge les données depuis users.json"""
    current_dir = Path.cwd()
    script_dir = Path(__file__).parent
    
    # Chercher le fichier dans plusieurs emplacements
    possible_paths = [
        current_dir / 'users.json',
        script_dir / 'users.json',
        Path(r'c:\Code\centraliz-daisy\debug\Migration\users.json')
    ]
    
    print(f"📂 Répertoire courant: {current_dir}")
    print(f"📂 Répertoire du script: {script_dir}")
    print("🔍 Recherche du fichier users.json dans:")
    
    for path in possible_paths:
        print(f"   - {path}")
        if path.exists():
            print(f"✅ Fichier trouvé: {path}")
            try:
                with open(path, 'r', encoding='utf-8') as file:
                    return json.load(file)
            except json.JSONDecodeError:
                print(f"❌ Erreur: Le fichier {path} contient du JSON invalide.")
                return None
    
    print("❌ Fichier users.json introuvable dans tous les emplacements.")
    print("\n📁 Fichiers présents dans le répertoire courant:")
    for file in current_dir.iterdir():
        if file.is_file():
            print(f"   - {file.name}")
    
    print("\n📁 Fichiers présents dans le répertoire du script:")
    for file in script_dir.iterdir():
        if file.is_file():
            print(f"   - {file.name}")
    
    return None

def convert_french_date_to_iso(date_str):
    """Convertit une date du format DD/MM/YYYY vers YYYY-MM-DD"""
    if not date_str:
        return None
    
    try:
        # Parser la date française (DD/MM/YYYY)
        date_obj = datetime.strptime(date_str, "%d/%m/%Y")
        # Retourner au format ISO (YYYY-MM-DD)
        return date_obj.strftime("%Y-%m-%d")
    except ValueError as e:
        print(f"⚠️ Erreur de conversion de date '{date_str}': {e}")
        return None

def transform_user_data(users_list):
    """Transforme et filtre les données des utilisateurs"""
    transformed_users = []
    
    # Débogage pour comprendre la structure des données
    print(f"🔍 Type des données reçues: {type(users_list)}")
    if users_list and len(users_list) > 0:
        print(f"🔍 Type du premier élément: {type(users_list[0])}")
        print(f"🔍 Premier élément: {users_list[0]}")
    
    # Vérifier si users_list est bien une liste
    if not isinstance(users_list, list):
        print("❌ Erreur: Les données ne sont pas dans le format attendu (liste)")
        return []
    
    for i, user in enumerate(users_list):
        # Vérifier si l'élément est un dictionnaire
        if not isinstance(user, dict):
            print(f"⚠️ Élément {i} ignoré: n'est pas un dictionnaire (type: {type(user)})")
            continue
        
        # Vérifier si l'utilisateur a un icalLink
        if not user.get('icalLink'):
            print(f"Utilisateur {user.get('userName', 'inconnu')} ignoré: pas d'icalLink")
            continue
        
        # Convertir la date de naissance
        birth_date_iso = convert_french_date_to_iso(user.get('birthDate'))
        
        # Transformer les données pour correspondre au schéma de la base
        transformed_user = {
            'userName': user.get('userName'),
            'displayName': user.get('displayName'),
            'icalLink': user.get('icalLink'),
            'group': user.get('group'),
            'birthDay': birth_date_iso,  # Date convertie au format ISO
            'isAdmin': False  # Toujours FALSE comme demandé
        }
        
        # Vérifier que userName est présent
        if not transformed_user['userName']:
            print(f"Utilisateur ignoré: userName manquant")
            continue
            
        transformed_users.append(transformed_user)
        birth_info = f" (né le {birth_date_iso})" if birth_date_iso else ""
        print(f"✅ Utilisateur {transformed_user['userName']} préparé pour migration{birth_info}")
    
    return transformed_users

def migrate_users_to_supabase(users_data):
    """Migre les utilisateurs vers Supabase"""
    # Vérifier les variables d'environnement
    if not check_environment():
        return 0, len(users_data)
    
    # Créer le client Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    success_count = 0
    error_count = 0
    
    for user in users_data:
        try:
            # Insérer l'utilisateur dans la base
            result = supabase.table('users').insert(user).execute()
            
            if result.data:
                print(f"✅ Utilisateur {user['userName']} ajouté avec succès")
                success_count += 1
            else:
                print(f"❌ Erreur lors de l'ajout de {user['userName']}")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Erreur lors de l'ajout de {user['userName']}: {str(e)}")
            error_count += 1
    
    return success_count, error_count

def main():
    """Fonction principale de migration"""
    print("🚀 Début de la migration des utilisateurs...")
    print("="*50)
    
    # Vérifier la configuration
    if not check_environment():
        return
    
    # Charger les données depuis JSON
    users_data = load_users_from_json()
    if not users_data:
        print("\n💡 AIDE:")
        print("   1. Assurez-vous que le fichier users.json existe")
        print("   2. Placez le fichier dans le même répertoire que ce script")
        print("   3. Ou spécifiez le chemin complet dans le code")
        return
    
    print(f"\n📁 {len(users_data)} utilisateurs trouvés dans users.json")
    print(f"🔍 Type des données: {type(users_data)}")
    
    # Gérer différents formats de données
    if isinstance(users_data, dict):
        print(f"📚 Les données sont un dictionnaire avec {len(users_data)} clés")
        
        # Convertir le dictionnaire en liste des valeurs pour le traitement
        users_list = list(users_data.values())
        print(f"✅ Conversion en liste de {len(users_list)} utilisateurs")
        
        # Afficher un échantillon des données pour le débogage
        print(f"🔍 Échantillon des données (3 premiers utilisateurs):")
        sample_size = min(3, len(users_list))
        for i in range(sample_size):
            user = users_list[i]
            user_name = user.get('userName', 'Nom inconnu')
            display_name = user.get('displayName', 'Nom d\'affichage inconnu')
            has_ical = 'Oui' if user.get('icalLink') else 'Non'
            print(f"   [{i+1}] {user_name} - {display_name} - iCal: {has_ical}")
    
    elif isinstance(users_data, list):
        users_list = users_data
        print(f"📋 Les données sont une liste avec {len(users_list)} éléments")
        
        # Afficher un échantillon des données pour le débogage
        print(f"🔍 Échantillon des données (3 premiers éléments):")
        sample_size = min(3, len(users_list))
        for i in range(sample_size):
            item = users_list[i]
            print(f"   [{i+1}] {type(item)}: {str(item)[:100]}...")
    
    else:
        print(f"❌ Format de données non supporté: {type(users_data)}")
        return
    
    # Transformer les données
    transformed_users = transform_user_data(users_list)
    print(f"✨ {len(transformed_users)} utilisateurs valides (avec icalLink)")
    
    if not transformed_users:
        print("❌ Aucun utilisateur valide à migrer")
        return
    
    # Migrer vers Supabase
    success_count, error_count = migrate_users_to_supabase(transformed_users)
    
    # Résumé
    print("\n" + "="*50)
    print("📊 RÉSUMÉ DE LA MIGRATION")
    print("="*50)
    print(f"✅ Utilisateurs ajoutés avec succès: {success_count}")
    print(f"❌ Erreurs: {error_count}")
    print(f"📁 Total traité: {success_count + error_count}")
    print("="*50)

if __name__ == "__main__":
    main()
