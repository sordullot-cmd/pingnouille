# Migrations SQL

La base est **partagée avec le dépôt `tr4de`** (l'app trading) : mêmes
utilisateurs, mêmes tables. Ne sont reprises ici que les migrations dont ce
dépôt-ci a besoin — celles des trades, des comptes, des prop firms, de la
discipline, de l'agrégation bancaire et des rapports IA de trading restent dans
`tr4de/supabase/`, et c'est de là qu'elles doivent être jouées.

Les numéros sont donc **troués** (016, 020, 022…) : ce sont les numéros
d'origine, gardés tels quels. Les renuméroter ferait croire que deux migrations
différentes portent le même nom d'un dépôt à l'autre.

Une nouvelle migration prend un numéro à partir de 100, pour ne jamais entrer en
collision avec la suite de `tr4de`.

`migration_auth_setup.sql` est la base commune (extensions, table `profiles`,
trigger de création de profil) : elle est idempotente et existe dans les deux
dépôts.
