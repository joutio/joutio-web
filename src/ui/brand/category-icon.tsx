import {
  BankIcon,
  BookOpenTextIcon,
  BriefcaseIcon,
  CpuIcon,
  FilmSlateIcon,
  FlaskIcon,
  GameControllerIcon,
  GlobeHemisphereWestIcon,
  GraduationCapIcon,
  HeadphonesIcon,
  LeafIcon,
  LightbulbIcon,
  PaletteIcon,
  PizzaIcon,
  StarIcon,
  TelevisionSimpleIcon,
  VolleyballIcon,
  type Icon,
  type IconProps,
} from '@phosphor-icons/react'
import type { CategoryCode } from '../tokens.generated'

/** Reflète le champ `icon` de chaque catégorie dans tokens.json. */
export const CATEGORY_ICONS: Record<CategoryCode, Icon> = {
  SPORTS: VolleyballIcon,
  EDUCATION: GraduationCapIcon,
  SCIENCE: FlaskIcon,
  TECHNOLOGY: CpuIcon,
  ENTERTAINMENT: StarIcon,
  LITERATURE: BookOpenTextIcon,
  ARTS: PaletteIcon,
  MUSIC: HeadphonesIcon,
  MOVIES: FilmSlateIcon,
  TELEVISION: TelevisionSimpleIcon,
  FOOD_AND_DRINK: PizzaIcon,
  HISTORY: BankIcon,
  GAMES: GameControllerIcon,
  NATURE: LeafIcon,
  BUSINESS: BriefcaseIcon,
  WORLD: GlobeHemisphereWestIcon,
  GENERAL: LightbulbIcon,
}

export function CategoryIcon({ category, ...props }: IconProps & { category: CategoryCode }) {
  const IconComponent = CATEGORY_ICONS[category]
  return <IconComponent aria-hidden {...props} />
}
