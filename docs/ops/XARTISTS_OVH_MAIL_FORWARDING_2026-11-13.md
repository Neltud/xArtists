# xArtists — redirections de mail OVH et preuve de réception

Date : 13 novembre 2026. Préparation opérateur seulement ; aucun alias déclaré créé.

## Objectif

Créer et tester les deux destinataires publics admin@xartists.art et contact@xartists.art, redirigés vers une destination Gmail privée définie uniquement dans l'administration du serveur. Ne jamais écrire la destination dans GitHub, des issues ou des journaux.

## Configuration vérifiée (DNS public)

- NS : dns107.ovh.net et ns107.ovh.net.
- MX : 1 mail.xartists.art, qui résout vers 146.59.146.223 (VPS OVHcloud).
- PTR : vps-1e220e55.vps.ovh.net.
- SPF : v=spf1 a mx a:mail.xartists.art -all.
- DMARC : politique reject avec alignement SPF strict aspf=s.

Le serveur MX est un VPS OVH, pas nécessairement un service MX Plan. Ne pas remplacer les MX par une valeur générique sans migration. Ni le DNS ni le PTR ne prouvent la présence d'une boîte.

## Procédure de reconnaissance sans modification

Depuis une connexion OVH propriétaire, identifier le VPS et sa méthode d'administration. Une session SSH autorisée peut exécuter : bash scripts/ops/check-xartists-vps-mail.sh . Le script n'affiche ni destinataires, ni secrets, ni cartes d'alias ; il indique seulement la présence des logiciels et des ports SMTP/IMAP.

Identifier s'il s'agit de Postfix (domaine local / mydestination, virtuel / virtual_mailbox_domains, virtual_alias_maps), Exim, Mailcow, Docker Mailserver, Plesk, Dovecot/Sieve ou un service externe. Sauvegarder et tester la possibilité de restauration avant toute édition. Ne jamais configurer un même domaine dans deux classes de réception incompatibles.

## Deux alias de redirection

Sur l'interface du destinataire réellement sélectionné par le MX, créer deux alias de réception :
- admin@xartists.art vers la destination Gmail privée de l'opérateur ;
- contact@xartists.art vers cette même destination Gmail privée.

Dans Postfix uniquement, si virtual_alias_maps est confirmé comme la source de vérité, les correspondances sont :

    admin@xartists.art     <DESTINATION_GMAIL_PRIVEE>
    contact@xartists.art   <DESTINATION_GMAIL_PRIVEE>

Ces lignes sont un exemple, PAS une commande à exécuter. L'administrateur adapte et valide la map effective, vérifie qu'il ne crée pas d'open relay, contrôle les conflits de domaine et n'applique un éventuel postmap/reload qu'après contrôle, sauvegarde et plan de retour arrière. Avec Dovecot et Sieve, préférer redirect + keep si une copie locale est nécessaire. Avec Mailcow/Plesk/Exim/OVH MX Plan, utiliser leur interface de gestion officielle au lieu de toucher aux fichiers d'un autre logiciel.

Une redirection ne crée aucune boîte indépendante sur OVH. Pour consulter la boîte professionnelle chez OVH tout en transmettant vers Gmail, il faut créer une vraie boîte et activer une redirection avec conservation des messages. Une simple redirection ne garantit pas non plus de pouvoir répondre depuis cette identité dans Gmail : l'envoi demande un SMTP authentifié.

## Problème important des transferts vers Gmail

SPF et DMARC peuvent faire échouer un transfert après changement d'hôte. Vérifier une solution SRS pour les enveloppes de réexpédition et la préservation des signatures DKIM originales ; SRS seul ne garantit pas DMARC. Surveiller les rebonds et les dossiers spam sans désactiver la politique DMARC actuelle au hasard.

## Critères d'activation et de publication

1. Envoi à admin@xartists.art depuis deux fournisseurs différents, par exemple Gmail et Outlook ; confirmation de réception des deux messages dans la vraie boîte Gmail de destination.
2. Envoi à contact@xartists.art depuis ces deux fournisseurs ; deux réceptions confirmées.
3. Réponse depuis contact@xartists.art par SMTP authentifié ; vérifier SPF, DKIM, DMARC et la bonne adresse From.
4. Si le besoin inclut des boîtes OVH autonomes, prouver leur existence et qu'elles conservent une copie.
5. Sans preuve des quatre réceptions et de la réponse sortante, conserver l'adresse commerciale non certifiée et ne pas l'afficher comme canal de contact fonctionnel.

Le connecteur Gmail de ChatGPT visible lors du diagnostic était lié à un compte Gmail différent de la destination demandée. Ne pas modifier ni tester cette mauvaise boîte. Aucun test de livraison réel n'est affirmé ici.

Après mise en service, consulter les messages depuis https://mail.google.com dans la bonne boîte et créer les filtres to:admin@xartists.art et to:contact@xartists.art pour séparer les deux flux.