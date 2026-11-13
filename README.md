# email_api

## Endpoints

### POST /api/add-contact

Crée un contact dans GetResponse.

- `email` (requis)
- `name` (requis)
- `campaignId` (optionnel)
- `tag` (**optionnel**) : nom du tag GetResponse à appliquer. Le tag est créé s'il n'existe pas ; si le contact existe déjà, le tag lui est ajouté.

### POST /api/subscribe-contact

Crée un contact dans GetResponse (clé API requise via `x-api-key`).

- `email` (requis)
- `name` (optionnel, défaut : partie locale de l'email)
- `listId` (optionnel)
- `tag` (**optionnel**) : nom du tag GetResponse à appliquer. Le tag est créé s'il n'existe pas ; si le contact existe déjà, le tag lui est ajouté.

### POST /api/lead-magnet-send

Envoie le lien de téléchargement d'un gift par email (Brevo). Clé API requise via `x-api-key`.

- `email`, `fileUrl`, `fileName` (requis)
- `fileTitle`, `name`, `listId` (optionnels)

## Intégration front : inscrire un contact avec une liste et un tag

Endpoint : `POST /api/subscribe-contact`
Production : `https://email-server-api-production.up.railway.app`
Header requis : `x-api-key: <PROTECTION_API_KEY>`

```js
const response = await fetch(
  "https://email-server-api-production.up.railway.app/api/subscribe-contact",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "VOTRE_CLE_API",
    },
    body: JSON.stringify({
      email: "client@example.com", // requis
      name: "Prénom Nom",          // optionnel
      listId: "qD1uT",             // optionnel : ID de liste GetResponse
      tag: "gift-bienvenue-chez-le-psy", // optionnel : tag appliqué au contact
    }),
  },
);

if (!response.ok) {
  const { error, details } = await response.json();
  throw new Error(`${response.status} ${error} ${details ?? ""}`);
}

const data = await response.json();
// data.status : "contact added" | "tag added to existing contact"
```

Champs du body :

| Champ    | Requis | Description                                                        |
| -------- | ------ | ------------------------------------------------------------------ |
| `email`  | oui    | Email du contact                                                   |
| `name`   | non    | Nom du contact (défaut : partie locale de l'email)                 |
| `listId` | non    | ID de liste GetResponse (défaut : `GETRESPONSE_LIST_ID`)           |
| `tag`    | non    | Nom du tag. Créé dans GetResponse s'il n'existe pas. Sans tag, le contact est inscrit sans tag. |

Réponses :

- `201` : `{ "status": "contact added", "message": "Contact créé avec succès" }` ou `{ "status": "tag added to existing contact", "message": "Contact déjà inscrit : tag ajouté" }`
- `400` : `{ "error": "email is required" }` / `{ "error": "Invalid email" }`
- `401` : `{ "error": "Unauthorized" }` (clé API manquante ou invalide)
- `500` : `{ "error": "Failed to add contact", "details": "..." }`
