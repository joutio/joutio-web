import { Link } from "react-router-dom"
import { LegalSection, LegalShell } from "../components/LegalShell"

const UPDATED_AT = "22 octobre 2026"
const CONTACT = "joutio.contacts@gmail.com"

/**
 * Politique de confidentialité publique.
 * URL utilisée dans Meta App Dashboard > Settings > Basic > Privacy Policy URL.
 */
export function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité" updatedAt={UPDATED_AT}>
      <p>
        Joutio est un jeu de quiz multijoueur. Cette politique explique quelles
        données nous collectons, pourquoi, combien de temps nous les conservons
        et comment exercer tes droits. Elle s&apos;applique au site{" "}
        <strong>app.joutio.com</strong> et à l&apos;application mobile
        Joutio.
      </p>

      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement est l&apos;éditeur de Joutio. Pour toute
          question relative à tes données personnelles, tu peux nous écrire à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données que nous collectons">
        <p>Nous collectons uniquement les données nécessaires au service :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Compte et authentification</strong> : adresse email, code de
            connexion à usage unique, fournisseur social utilisé (Google ou
            Facebook), identifiant de compte, statut du compte.
          </li>
          <li>
            <strong>Profil</strong> : pseudonyme, biographie, pays, langue,
            avatar, bannière et préférences.
          </li>
          <li>
            <strong>Activité de jeu</strong> : sujets suivis, parties, réponses,
            scores, expérience par thème, paliers de maîtrise, badges, titres, classements et
            historique de jeu.
          </li>
          <li>
            <strong>Interactions sociales</strong> : abonnements, abonnés, défis,
            salons, invitations et signalements.
          </li>
          <li>
            <strong>Notifications</strong> : préférences de notification et
            abonnement aux notifications push.
          </li>
          <li>
            <strong>Contenus</strong> : sujets, questions, images et textes que
            tu crées ou téléverses.
          </li>
          <li>
            <strong>Données techniques</strong> : adresse IP, type de navigateur
            ou d&apos;appareil, horodatage des requêtes et journaux de sécurité.
          </li>
        </ul>
        <p>
          Nous ne collectons pas de données de paiement (le service est
          actuellement gratuit) et nous n&apos;utilisons pas de cookies
          publicitaires ou de traceurs de mesure d&apos;audience tiers.
        </p>
      </LegalSection>

      <LegalSection title="3. Connexion via Google ou Facebook">
        <p>
          Si tu choisis de te connecter avec Google ou Facebook, le fournisseur
          nous transmet les informations que tu as autorisées, généralement ton
          nom, ton adresse email et ta photo de profil. Pour Facebook, nous
          recevons également un identifiant applicatif (ASID) permettant de
          reconnaître ton compte.
        </p>
        <p>
          Nous ne recevons jamais ton mot de passe Google ou Facebook. Nous
          n&apos;accédons pas à tes amis, publications, messages ou photos, et
          nous ne publions rien en ton nom. Tu peux révoquer l&apos;accès de
          Joutio depuis les paramètres de sécurité de ton compte Google ou
          Facebook.
        </p>
        <p>
          Si Facebook ne nous transmet pas d&apos;adresse email, la connexion
          Facebook est refusée et tu peux utiliser la connexion par code email.
        </p>
      </LegalSection>

      <LegalSection title="4. Finalités et bases légales">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Fournir le service</strong> (compte, jeu, classements,
            social) : exécution du contrat qui te lie à Joutio.
          </li>
          <li>
            <strong>Sécurité et modération</strong> (lutte contre la fraude, les
            abus et les comptes multiples) : intérêt légitime.
          </li>
          <li>
            <strong>Notifications push et emails transactionnels</strong> :
            exécution du contrat pour les emails de connexion ; consentement
            pour les notifications push, que tu peux retirer à tout moment.
          </li>
          <li>
            <strong>Respect de nos obligations légales</strong> : obligation
            légale.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cookies et stockage local">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cookie de session AUTH_TX</strong> : indispensable au bon
            fonctionnement de la connexion et du protocole OIDC.
          </li>
          <li>
            <strong>Jetons de session</strong> : conservés côté web par le
            client OIDC et côté mobile dans le stockage sécurisé de
            l&apos;appareil (SecureStore).
          </li>
          <li>
            <strong>Cache hors ligne</strong> : le service worker met en cache
            les images publiques pour améliorer le chargement. Il ne contient pas
            de données de profil.
          </li>
        </ul>
        <p>
          Aucun cookie publicitaire ni traceur tiers de type pixel Meta ou
          Google Analytics n&apos;est utilisé.
        </p>
      </LegalSection>

      <LegalSection title="6. Durées de conservation">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Compte et données de jeu</strong> : pendant la durée de vie
            du compte. La suppression depuis l&apos;application est immédiate.
          </li>
          <li>
            <strong>Sauvegardes, journaux et flux techniques</strong> : jusqu&apos;à
            30 jours maximum après la suppression, le temps que les sauvegardes
            et les files de messages expirent. Ils ne sont pas utilisés pour te
            réidentifier.
          </li>
          <li>
            <strong>Parties passées</strong> : l&apos;historique des adversaires
            est conservé avec le nom « Joueur supprimé ». Les événements
            techniques de partie peuvent encore contenir les anciens pseudonymes
            le temps de leur rétention, sans être affichés.
          </li>
          <li>
            <strong>Signalements et décisions de modération</strong> : le temps
            nécessaire au traitement et à la prévention des récidives.
          </li>
          <li>
            <strong>Statistiques agrégées</strong> : des données anonymisées
            peuvent être conservées pour les classements et les statistiques du
            service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Destinataires et sous-traitants">
        <p>
          Tes données ne sont jamais vendues. Elles peuvent être traitées par :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Meta (Facebook Login)</strong> et{" "}
            <strong>Google (Google Sign-In)</strong> pour l&apos;authentification
            sociale ;
          </li>
          <li>
            <strong>Resend</strong> pour l&apos;envoi des emails de connexion et
            de notification ;
          </li>
          <li>
            notre infrastructure d&apos;hébergement et de stockage des médias
            (MinIO) ;
          </li>
          <li>
            les autorités compétentes, lorsque la loi l&apos;exige.
          </li>
        </ul>
        <p>
          Certains prestataires peuvent traiter des données en dehors de
          l&apos;Union européenne. Dans ce cas, nous nous appuyons sur les
          garanties prévues par le RGPD (clauses contractuelles types ou
          mécanisme équivalent).
        </p>
      </LegalSection>

      <LegalSection title="8. Tes droits">
        <p>
          Conformément au RGPD, tu disposes des droits suivants : accès,
          rectification, effacement, limitation du traitement, opposition,
          portabilité et retrait du consentement. Pour les exercer, écris-nous à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          depuis l&apos;adresse email associée à ton compte.
        </p>
        <p>
          Tu peux également introduire une réclamation auprès de la CNIL
          (www.cnil.fr) ou de l&apos;autorité de protection des données de ton
          pays de résidence.
        </p>
      </LegalSection>

      <LegalSection id="suppression" title="9. Suppression de tes données">
        <p>
          Ouvre <strong>Réglages → Zone de danger → Supprimer mon compte</strong>.
          Un code de confirmation est envoyé à l&apos;adresse email du compte ;
          saisis-le pour confirmer. La suppression est immédiate et définitive.
        </p>
        <p>
          Si tu ne peux plus te connecter, écris à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          avec pour objet <strong>« Suppression de compte »</strong>, depuis
          l&apos;adresse email utilisée pour te connecter à Joutio.
        </p>
        <p>
          Les sauvegardes, journaux et flux techniques expirent sous 30 jours.
          Les données dont la conservation est imposée par la loi, ainsi que les
          statistiques anonymisées, peuvent être conservées plus longtemps.
        </p>
        <p>
          La suppression du compte Joutio ne supprime pas ton compte Google ou
          Facebook. Pour révoquer l&apos;accès de Joutio à ces comptes, utilise
          les paramètres de sécurité du fournisseur concerné.
        </p>
        <p>
          Tu peux aussi demander une copie de tes données ou leur rectification
          à la même adresse. La procédure est détaillée sur la page{" "}
          <Link to="/data-deletion" className="underline underline-offset-2">
            Suppression de tes données
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Sécurité">
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          raisonnables : HTTPS, codes de connexion à usage unique, jetons signés
          et à durée limitée, contrôle des accès, journalisation et procédure de
          suspension des comptes compromis. Aucun système n&apos;étant infaillible,
          nous te recommandons de protéger l&apos;accès à ta boîte email.
        </p>
      </LegalSection>

      <LegalSection title="11. Mineurs">
        <p>
          Le service n&apos;est pas destiné aux personnes n&apos;ayant pas
          l&apos;âge légal pour consentir seules au traitement de leurs données
          personnelles (15 ans en France). Si tu penses qu&apos;un mineur nous a
          transmis des données sans autorisation, contacte-nous pour que nous les
          supprimions.
        </p>
      </LegalSection>

      <LegalSection title="12. Modifications">
        <p>
          Cette politique peut être mise à jour pour refléter l&apos;évolution du
          service ou de la réglementation. La date de dernière mise à jour est
          indiquée en haut de cette page. Les changements importants seront
          signalés dans l&apos;application.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
