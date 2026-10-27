import { LegalSection, LegalShell } from "../components/LegalShell"

const UPDATED_AT = "19 octobre 2026"
const CONTACT = "joutio.contacts@gmail.com"

/**
 * Conditions d'utilisation publiques.
 * URL utilisée dans Meta App Dashboard > Settings > Basic > Terms of Service URL.
 */
export function TermsPage() {
  return (
    <LegalShell title="Conditions d'utilisation" updatedAt={UPDATED_AT}>
      <p>
        Les présentes conditions encadrent l&apos;utilisation du service Joutio,
        accessible via le site <strong>app.joutio.com</strong> et
        l&apos;application mobile Joutio. En créant un compte ou en utilisant le
        service, tu acceptes ces conditions.
      </p>

      <LegalSection title="1. Le service">
        <p>
          Joutio est un jeu de quiz multijoueur permettant de créer ou suivre
          des sujets, de défier d&apos;autres joueurs, de participer à des duels
          et de progresser via des points d&apos;expérience, des paliers de maîtrise, des
          badges et des classements.
        </p>
        <p>
          Le service est actuellement gratuit. Certaines fonctionnalités peuvent
          évoluer, être suspendues ou être retirées, notamment pour des raisons
          de maintenance ou de sécurité.
        </p>
      </LegalSection>

      <LegalSection title="2. Compte">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            L&apos;authentification se fait par code à usage unique envoyé par
            email, ou via Google/Facebook. Aucun mot de passe Joutio
            n&apos;est stocké.
          </li>
          <li>
            Tu dois fournir une adresse email valide et garder l&apos;accès à
            cette boîte email sécurisé.
          </li>
          <li>
            Tu es responsable de l&apos;activité réalisée depuis ton compte. Un
            compte est destiné à une personne ; la création de comptes multiples
            pour contourner une suspension ou un classement est interdite.
          </li>
          <li>
            Tu peux demander la suppression de ton compte à tout moment via{" "}
            <a
              className="underline underline-offset-2"
              href="/privacy#suppression"
            >
              la procédure de suppression
            </a>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Utilisation acceptable">
        <p>Il est interdit notamment de :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            tricher, manipuler les scores, les classements ou le résultat
            d&apos;une partie ;
          </li>
          <li>
            harceler, menacer, insulter ou discriminer d&apos;autres joueurs ;
          </li>
          <li>
            publier des contenus illégaux, haineux, violents, pornographiques ou
            portant atteinte aux droits d&apos;autrui ;
          </li>
          <li>
            usurper l&apos;identité d&apos;une personne ou d&apos;une entité ;
          </li>
          <li>
            perturber le service, tenter d&apos;accéder à des données
            auxquelles tu n&apos;as pas droit ou contourner les mesures de
            sécurité ;
          </li>
          <li>
            utiliser des robots, scripts ou outils automatisés pour jouer ou
            collecter des données.
          </li>
        </ul>
        <p>
          Les contenus et comptes signalés peuvent faire l&apos;objet d&apos;une
          modération. Un compte peut être suspendu ou supprimé en cas de
          violation de ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="4. Contenus créés par les joueurs">
        <p>
          Tu restes propriétaire des sujets, questions, textes et images que tu
          crées. En les publiant, tu accordes à Joutio une licence non exclusive,
          mondiale et gratuite pour les héberger, les afficher et les utiliser
          dans le fonctionnement du service (parties, classements, partage).
        </p>
        <p>
          Tu garantis que tu détiens les droits nécessaires sur les contenus que
          tu publies et que ceux-ci ne portent pas atteinte aux droits de tiers.
          Les images téléversées doivent respecter les droits d&apos;auteur et le
          droit à l&apos;image.
        </p>
        <p>
          Nous pouvons retirer un contenu signalé ou manifestement contraire à
          ces conditions, sans que cela constitue une suppression définitive de
          ton compte sauf récidive.
        </p>
      </LegalSection>

      <LegalSection title="5. Propriété intellectuelle">
        <p>
          Le nom Joutio, l&apos;interface, les éléments graphiques, le code et
          les contenus propres au service sont protégés par le droit de la
          propriété intellectuelle. Sauf autorisation écrite, tu ne peux pas les
          reproduire, les modifier ou les exploiter en dehors de l&apos;usage
          normal du service.
        </p>
        <p>
          Les marques et logos de tiers (Google, Facebook, WhatsApp, etc.)
          appartiennent à leurs propriétaires respectifs.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité et responsabilité">
        <p>
          Le service est fourni « en l&apos;état ». Nous faisons nos efforts pour
          assurer sa disponibilité et sa sécurité, mais nous ne garantissons pas
          une absence totale d&apos;interruption, d&apos;erreur ou de perte de
          données. Il est recommandé de ne pas utiliser Joutio comme unique
          moyen de sauvegarde de contenus importants.
        </p>
        <p>
          Dans les limites autorisées par la loi, Joutio ne peut être tenu
          responsable des dommages indirects résultant de l&apos;utilisation ou
          de l&apos;impossibilité d&apos;utiliser le service. Les dispositions
          impératives protégeant les consommateurs restent applicables.
        </p>
      </LegalSection>

      <LegalSection title="7. Suspension et résiliation">
        <p>
          Nous pouvons suspendre ou résilier un compte en cas de violation de ces
          conditions, de comportement frauduleux ou de danger pour les autres
          joueurs. Tu peux cesser d&apos;utiliser le service et demander la
          suppression de ton compte à tout moment.
        </p>
      </LegalSection>

      <LegalSection title="8. Données personnelles">
        <p>
          Le traitement de tes données est décrit dans la{" "}
          <a className="underline underline-offset-2" href="/privacy">
            politique de confidentialité
          </a>
          , qui fait partie intégrante de ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="9. Droit applicable et contact">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, une
          solution amiable sera recherchée avant toute action judiciaire ; les
          tribunaux compétents restent ceux prévus par la loi applicable.
        </p>
        <p>
          Pour toute question, écris-nous à{" "}
          <a className="underline underline-offset-2" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  )
}
