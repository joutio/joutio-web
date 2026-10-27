import { Link } from "react-router-dom"
import { LegalSection, LegalShell } from "../components/LegalShell"

const UPDATED_AT = "22 octobre 2026"
const CONTACT = "joutio.contacts@gmail.com"

/**
 * Procédure publique de suppression des données.
 * URL utilisée dans Meta App Dashboard > Settings > Basic > User Data Deletion.
 */
export function DataDeletionPage() {
  return (
    <LegalShell title="Suppression de tes données" updatedAt={UPDATED_AT}>
      <p>
        Tu peux demander à tout moment la suppression de ton compte Joutio et des
        données personnelles associées. Cette page décrit la procédure et ce qui
        est effacé.
      </p>

      <LegalSection title="1. Suppression depuis l’application">
        <p>
          Connecte-toi, ouvre <strong>Réglages → Zone de danger</strong>, puis
          clique sur <strong>« Supprimer mon compte »</strong>. Un code de
          confirmation est envoyé à l’adresse email du compte ; saisis-le pour
          confirmer.
        </p>
        <p>
          La suppression est alors <strong>immédiate et définitive</strong>. Il
          n’y a pas de délai de grâce ni de possibilité de restaurer le compte.
          Tu peux ensuite créer un nouveau compte avec le même email : il
          repart de zéro, sans hériter de l’ancien.
        </p>
      </LegalSection>

      <LegalSection title="2. Si tu ne peux plus te connecter">
        <p>
          Envoie un email à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          avec l’objet <strong>« Suppression de compte »</strong> et l’adresse
          email utilisée pour te connecter. Nous pouvons demander une
          confirmation depuis cette adresse.
        </p>
      </LegalSection>

      <LegalSection title="3. Données supprimées">
        <ul className="list-disc space-y-1 pl-5">
          <li>compte, adresse email, sessions, jetons et consentements ;</li>
          <li>profil (pseudonyme, bio, pays, langue, avatar, bannière) ;</li>
          <li>
            progression, expérience, classements, badges, titres et série de
            présence ;
          </li>
          <li>
            abonnements, abonnés, invitations, salons, notifications et
            préférences ;
          </li>
          <li>
            sujets et questions dont tu es propriétaire, ainsi que les questions
            que tu as créées dans les sujets d’autres joueurs ;
          </li>
          <li>images personnelles et abonnements aux notifications push.</li>
        </ul>
        <p className="mt-3">
          Les questions supprimées dans le sujet d’un autre joueur peuvent faire
          repasser ce sujet en brouillon s’il ne lui reste plus assez de
          questions approuvées. Son propriétaire en est informé.
        </p>
      </LegalSection>

      <LegalSection title="4. Parties et données conservées">
        <p>
          Les parties passées sont conservées dans l’historique des autres
          joueurs, mais ton nom y est remplacé par « Joueur supprimé ». Les
          événements techniques de partie peuvent encore contenir les anciens
          pseudonymes le temps de leur rétention ; ils ne sont plus affichés.
        </p>
        <p>
          Les sauvegardes PostgreSQL, les journaux et les flux de messages
          peuvent conserver des traces chiffrées ou techniques pendant leur
          durée de rétention, jusqu’à <strong>30 jours</strong>. Ils ne sont pas
          utilisés pour te réidentifier. Les statistiques agrégées et
          anonymisées peuvent être conservées.
        </p>
      </LegalSection>

      <LegalSection title="5. Comptes Google et Facebook">
        <p>
          La suppression de ton compte Joutio ne supprime pas ton compte Google
          ou Facebook. Pour révoquer l&apos;accès de Joutio à ces comptes,
          utilise les paramètres de sécurité du fournisseur concerné :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Google : Compte Google → Sécurité → Applications et services tiers.
          </li>
          <li>
            Facebook : Paramètres → Applications et sites web → Joutio →
            Supprimer.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Autres droits">
        <p>
          Tu peux également demander l&apos;accès à tes données, leur
          rectification, la limitation du traitement ou leur portabilité en
          écrivant à la même adresse. Plus d&apos;informations dans la{" "}
          <Link to="/privacy" className="underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  )
}
