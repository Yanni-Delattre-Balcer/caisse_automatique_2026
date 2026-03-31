# Configuration Auth0 pour OmniPOS

## 1. Créer un compte Auth0

1. Aller sur https://auth0.com et créer un compte
2. Créer un nouveau **Tenant** (ex: `omnipos-prod`)

## 2. Créer une Application

1. Dashboard Auth0 → **Applications** → **Create Application**
2. Nom: `OmniPOS`
3. Type: **Single Page Web Applications**
4. Cliquer **Create**

## 3. Configurer l'Application

Dans les **Settings** de l'application:

```
Allowed Callback URLs:        https://votre-domaine.com/login, http://localhost:5177/login
Allowed Logout URLs:          https://votre-domaine.com/, http://localhost:5177/
Allowed Web Origins:          https://votre-domaine.com, http://localhost:5177
```

## 4. Récupérer les identifiants

Notez les valeurs suivantes (onglet Settings):

| Champ              | Variable d'environnement     |
|--------------------|------------------------------|
| Domain             | `VITE_AUTH0_DOMAIN`          |
| Client ID          | `VITE_AUTH0_CLIENT_ID`       |
| Client Secret      | (Ne PAS exposer côté client) |

## 5. Ajouter au fichier `.env`

```env
VITE_AUTH0_DOMAIN=votre-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AUTH0_CALLBACK_URL=http://localhost:5177/login
```

## 6. Installer le SDK

```bash
npm install @auth0/auth0-react
```

## 7. Configurer le Provider

Dans `src/main.jsx`, wrappez votre app avec `Auth0Provider`:

```jsx
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain={import.meta.env.VITE_AUTH0_DOMAIN}
  clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
  authorizationParams={{
    redirect_uri: window.location.origin + '/login',
  }}
>
  <App />
</Auth0Provider>
```

## 8. Utiliser dans les composants

```jsx
import { useAuth0 } from '@auth0/auth0-react';

function LoginButton() {
  const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0();

  if (isAuthenticated) {
    return (
      <div>
        <p>Bienvenue {user.name}</p>
        <button onClick={() => logout()}>Se déconnecter</button>
      </div>
    );
  }

  return <button onClick={() => loginWithRedirect()}>Se connecter</button>;
}
```

## 9. Connecter Auth0 avec Supabase

Pour utiliser Auth0 comme provider dans Supabase:

1. Dashboard Supabase → **Authentication** → **Providers**
2. Activer **Auth0** (ou utiliser un JWT custom)
3. Entrer votre Auth0 Domain et Client ID

> **Note**: L'inscription Auth0 gère automatiquement la création de compte.
> Vous n'avez qu'à remplir les variables d'environnement et installer le SDK.

## 10. Connexions sociales (optionnel)

Dashboard Auth0 → **Authentication** → **Social**:
- Google
- Apple
- Facebook

Chaque provider nécessite sa propre configuration (Client ID/Secret du provider).
