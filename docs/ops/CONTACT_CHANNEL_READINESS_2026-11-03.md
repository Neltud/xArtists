# Contact commercial xArtists — contrôle DNS et sécurité des demandes

**Relevé public du 3 novembre 2026.** Ce document traite de la
**réception des prospects**, pas d'une ouverture au paiement.

## Diagnostic constaté (lecture seule)

- Le domaine `xartists.art` renvoie le statut DNS `3` (`NXDOMAIN`)
  pour les requêtes `A`, `NS` et `MX` sur le résolveur public
  Google DNS-over-HTTPS :
  `https://dns.google/resolve?name=xartists.art&type=MX`.
- Le même domaine n'a **pas de destination email vérifiée**.
  Il ne faut pas faire cliquer un prospect sur
  `mailto:hello@xartists.art` ni prétendre que ce message arrive.
- La connexion Gmail disponible dans ChatGPT est un **compte personnel
  distinct** ; elle ne prouve pas la réception de `hello@xartists.art`.
  On ne publie pas l'adresse personnelle comme remède sans accord du
  propriétaire.

Ces observations reflètent les réponses DNS à cet instant ;
elles doivent être recontrôlées après toute opération chez le registrar.

## Chemin de contact provisoire (sans données personnelles)

1. Les visiteurs peuvent voir `https://neltud.github.io/xArtists/offres/`.
2. Le bouton ouvre le formulaire public
   `https://github.com/Neltud/xArtists/issues/new?template=commercial-introduction.yml`.
   La création exige un compte GitHub. **Le ticket et les réponses
   sont visibles publiquement** : ni email, téléphone, carte bancaire,
   adresse physique, numéro d'ordre, secret, wallet/seed, preuve de
   propriété privée ou œuvre non publiée.
3. Le lien X `https://x.com/tudurioriginal` renvoie seulement au
   profil historique public ; aucune disponibilité des DM n'est affirmée.
4. Une demande ne crée aucun ordre, droit, réservation ou devis ferme ;
   les opérateurs peuvent inviter un prospect à passer à un **canal
   privé vérifié**, seulement après son établissement.

## Réactiver l'email — critères de réussite indispensables

- [ ] Vérifier la propriété et le renouvellement du domaine auprès
  du registrar, puis son délégataire DNS ; **ne publier aucun identifiant
  ni jeton dans le dépôt**.
- [ ] Publier des enregistrements NS/SOA et une zone valides pour
  `xartists.art`, puis les MX **fournis par l'hébergeur email choisi**
  (ne jamais inventer les serveurs MX).
- [ ] Configurer SPF, DKIM et DMARC selon les instructions du fournisseur
  et vérifier la politique d'envoi. Ne publier ni clés privées ni
  tokens d'administration.
- [ ] Vérifier la création réelle de la boîte `hello@xartists.art`
  ou de son alias dans le fournisseur ; seule une entrée MX ne prouve
  pas qu'un destinataire existe.
- [ ] Envoyer **deux emails de test contrôlés** depuis des fournisseurs
  externes et obtenir une confirmation de réception par l'opérateur
  dans la boîte commerciale, plus un test de réponse.
- [ ] Uniquement ensuite créer une PR remplaçant le lien GitHub public
  par un email professionnel réellement exploitable ; valider mobile,
  anti-spam, protection des données et métriques consenties.
- [ ] Surveiller les rebonds et erreurs après la reprise.

## Contexte technique connexe, indépendant du contact

Le 3 novembre, `GET /v1/ops/orders-store/status` répondait 200 avec
`backend=postgres`, `table_ready=true`, sur l'API connectée à Render.
`GET /v1/ops/mint-jobs-store/status` répondait 503. La liste Render
ne contenait aucune instance PostgreSQL managée ; le DSN peut donc
cibler une autre plateforme. **Une connexion orders fonctionnelle ne
prouve ni le schéma mint_jobs, ni les droits de son utilisateur.**
Le connecteur Neon visible n'autorise pas d'attribuer ce DSN sans
comparaison privée. #281 demeure ouvert ; aucune migration prod
n'est lancée et aucun mint ou checkout ne doit être activé.

## Message de lancement responsable

**Vitrine et demandes publiques ouvertes ; ventes et livraison NFT
toujours indisponibles.** L'email `@xartists.art` n'est pas un canal
commercial valide tant qu'il ne passe pas les tests ci-dessus.
