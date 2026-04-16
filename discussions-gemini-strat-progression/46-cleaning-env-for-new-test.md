Procédure de nettoyage après un test de paiement
À suivre impérativement avant de relancer un test de tunnel de vente "à blanc".

1. Côté Stripe : Résiliation de l'abonnement
Cette étape permet de dire à Stripe que le client n'est plus engagé, ce qui déclenche l'événement de résiliation.

Aller dans l'onglet Clients (Customers) du Dashboard Stripe.

Sélectionner le profil du client utilisé pour le test.

Dans la section Abonnements (Subscriptions), cliquer sur les trois petits points ... à droite de l'abonnement actif.

Choisir Résilier l'abonnement (Cancel subscription).

Important : Sélectionner Immédiatement (Immediately) dans les options de résiliation.

2. Supabase SQL Editor 
            
DELETE FROM subscriptions WHERE business_id = (                               
    SELECT id FROM businesses WHERE owner_id = auth.uid()                       
);                                                                  
                                                                                
UPDATE businesses
SET subscription_status = 'trial'                                             
WHERE owner_id = (SELECT id FROM auth.users WHERE email =           
'briac.le.meillat@gmail.com');