# Flux d'Authentification & Navigation

Ce document répertorie le flux logique de connexion et de redirection pour l'écosystème Nexus / Heryze.

## Schéma de Navigation

```mermaid
graph TD
    %% Entrées
    Start_Landing["Page d'Accueil (/)"]
    Start_Nexus["Page Nexus Hub (/nexus-prop)"]
    
    %% Boutons Landing
    Btn_Hero_Demo["Bouton Hero 'Démonstration'"]
    Btn_Nav_Conn["Bouton Nav 'Connexion'"]
    Section_Demo["Section #store (Testez à fond)"]
    Btn_Real_Demo["Bouton 'Accéder au Mode Démo'"]
    
    Start_Landing --> Btn_Nav_Conn
    Start_Landing --> Btn_Hero_Demo
    Btn_Hero_Demo -- "Smooth Scroll" --> Section_Demo
    Section_Demo --> Btn_Real_Demo
    
    %% Boutons Nexus
    Btn_Nav_N["Navbar Nexus (Recherche + Panier)"]
    Btn_Connect_N["Lien 'Connectez-vous' (Menu Panier)"]
    Start_Nexus --> Btn_Nav_N
    Btn_Nav_N -- "Dropdown Panier" --> Btn_Connect_N
    
    %% Direction Login
    Btn_Nav_Conn -- "redirect=/" --> Page_Login["Page Login (/login)"]
    Btn_Connect_N -- "redirect=/nexus-prop" --> Page_Login
    
    %% Login / Inscription
    Page_Login --> Auth{Login ou Register}
    Auth -- "Succès" --> Check_Origin{Redirection Locale?}
    
    %% Sorties Redirection
    Check_Origin -- "redirect=/" --> Final_Landing["Accueil (/) Connecté"]
    Check_Origin -- "redirect=/nexus-prop" --> Final_Nexus["Nexus (/nexus-prop) Connecté"]
    
    %% Actions Connectées
    Final_Landing --> Profile_Menu["Menu Profil (Avatar)"]
    Final_Nexus --> Profile_Menu
    
    Final_Landing --> Btn_Launch_L["Bouton 'Lancer Heryze'"]
    Final_Nexus --> Btn_Launch_N["Bouton 'Lancer Heryze'"]
    
    %% Conclusion Smart Action
    Btn_Final_Launch["CTA Final 'Lancer Heryze'"]
    Btn_Final_Launch -- "Authenticated" --> POS["Interface POS (/pos)"]
    Btn_Final_Launch -- "Unauthenticated" --> Page_Login_Direct["Login (redirect=/pos)"]
    
    Btn_Launch_L --> POS
    Btn_Launch_N --> POS
    Btn_Real_Demo -- "Mock Auth" --> POS
    
    style Page_Login fill:#fff4dd,stroke:#d4a017
    style Auth fill:#fff4dd,stroke:#d4a017
    style Final_Landing fill:#e1f5fe,stroke:#01579b
    style Section_Demo fill:#f3e5f5,stroke:#7b1fa2
```

## Résumé du Comportement

1. **Persistance de l'origine** : Le paramètre `redirect` dans l'URL garantit que l'utilisateur revient à sa page de départ après connexion.
2. **Contextualisation des CTAs** :
    *   **Hero** : Orienté découverte ("Démonstration") avec scroll vers la zone de test.
    *   **Navbars** : Orientées accès rapide ("Connexion" ou "Lancer Heryze").
    *   **Conclusion** : Bouton intelligent qui détecte l'état d'authentification pour mener directement au `/pos`.
3. **Accès Démo** : Un mode sans friction qui simule une session authentifiée pour tester l'interface `QuickPos`.
4. **Gestion du Profil** : Une fois connecté, un avatar avec initiales remplace les éléments de connexion, offrant un menu pour la gestion du compte et la déconnexion.
