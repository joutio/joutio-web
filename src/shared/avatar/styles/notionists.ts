import notionistsDefinition from "@dicebear/styles/notionists.json"
import type { StyleDefinition } from "@dicebear/core"
import {
  Brush,
  Eye,
  Glasses,
  Hand,
  PaintBucket,
  Palette,
  PenLine,
  Scissors,
  Shirt,
  Smile,
  Sparkles,
  Triangle,
  VenetianMask,
} from "lucide-react"
import { collectPalettes, collectVariants } from "./derive"
import { numberedVariants, variantLabelKeys } from "./labels"
import { BACKGROUND_COLORS, INK_COLORS, PAPER_COLORS } from "./palettes"
import type { AvatarStyleDefinition, AvatarStyleGroup } from "./types"

const EYEBROWS_VARIANTS = numberedVariants("variant", 13)
const EYES_VARIANTS = numberedVariants("variant", 5)
const NOSE_VARIANTS = numberedVariants("variant", 20)
const MOUTH_VARIANTS = numberedVariants("variant", 30)
const HAIR_NUMBERED_VARIANTS = numberedVariants("variant", 63)
const HAIR_VARIANTS = ["hat", ...HAIR_NUMBERED_VARIANTS]
const BEARD_VARIANTS = numberedVariants("variant", 12)
const CLOTHES_VARIANTS = numberedVariants("variant", 25)
const CLOTHES_GRAPHIC_VARIANTS = ["electric", "galaxy", "saturn"] as const
const GESTURE_VARIANTS = [
  "hand",
  "handPhone",
  "ok",
  "okLongArm",
  "point",
  "pointLongArm",
  "waveLongArm",
  "waveLongArms",
  "waveOkLongArms",
  "wavePointLongArms",
] as const
const GLASSES_VARIANTS = numberedVariants("variant", 11)

const GESTURE_LABEL_KEYS = {
  hand: "avatar.options.hand",
  handPhone: "avatar.options.phone",
  ok: "avatar.options.ok",
  okLongArm: "avatar.options.okLongArm",
  point: "avatar.options.point",
  pointLongArm: "avatar.options.pointLongArm",
  waveLongArm: "avatar.options.wave",
  waveLongArms: "avatar.options.waveBothArms",
  waveOkLongArms: "avatar.options.waveOk",
  wavePointLongArms: "avatar.options.wavePoint",
} as const

const groups: AvatarStyleGroup[] = [
  {
    id: "visage",
    labelKey: "avatar.groups.face",
    icon: Smile,
    sections: [
      {
        id: "eyes",
        labelKey: "avatar.sections.eyes",
        icon: Eye,
        variantField: "eyes",
        variants: EYES_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "eyes", EYES_VARIANTS),
      },
      {
        id: "eyebrows",
        labelKey: "avatar.sections.eyebrows",
        icon: Brush,
        variantField: "eyebrows",
        variants: EYEBROWS_VARIANTS,
        labelKeys: variantLabelKeys(
          "notionists",
          "eyebrows",
          EYEBROWS_VARIANTS
        ),
      },
      {
        id: "nose",
        labelKey: "avatar.sections.nose",
        icon: Triangle,
        variantField: "nose",
        variants: NOSE_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "nose", NOSE_VARIANTS),
      },
      {
        id: "mouth",
        labelKey: "avatar.sections.mouth",
        icon: Smile,
        variantField: "mouth",
        variants: MOUTH_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "mouth", MOUTH_VARIANTS),
      },
    ],
  },
  {
    id: "cheveux",
    labelKey: "avatar.groups.hair",
    icon: Scissors,
    sections: [
      {
        id: "hair",
        labelKey: "avatar.sections.hair",
        icon: Scissors,
        variantField: "hair",
        variants: HAIR_VARIANTS,
        labelKeys: {
          hat: "avatar.options.hat",
          ...variantLabelKeys("notionists", "hair", HAIR_NUMBERED_VARIANTS),
        },
        allowsNone: true,
      },
      {
        id: "beard",
        labelKey: "avatar.sections.beard",
        icon: VenetianMask,
        variantField: "beard",
        variants: BEARD_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "beard", BEARD_VARIANTS),
        allowsNone: true,
      },
    ],
  },
  {
    id: "tenue",
    labelKey: "avatar.groups.outfit",
    icon: Shirt,
    sections: [
      {
        id: "clothes",
        labelKey: "avatar.sections.clothes",
        icon: Shirt,
        variantField: "clothes",
        variants: CLOTHES_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "clothes", CLOTHES_VARIANTS),
      },
      {
        id: "clothesGraphic",
        labelKey: "avatar.sections.clothesGraphic",
        icon: Sparkles,
        variantField: "clothesGraphic",
        variants: CLOTHES_GRAPHIC_VARIANTS,
        labelKeys: {
          electric: "avatar.options.lightning",
          galaxy: "avatar.options.galaxy",
          saturn: "avatar.options.saturn",
        },
        allowsNone: true,
      },
      {
        id: "gesture",
        labelKey: "avatar.sections.gesture",
        icon: Hand,
        variantField: "gesture",
        variants: GESTURE_VARIANTS,
        labelKeys: GESTURE_LABEL_KEYS,
        allowsNone: true,
      },
    ],
  },
  {
    id: "accessoires",
    labelKey: "avatar.groups.accessories",
    icon: Glasses,
    sections: [
      {
        id: "glasses",
        labelKey: "avatar.sections.glasses",
        icon: Glasses,
        variantField: "glasses",
        variants: GLASSES_VARIANTS,
        labelKeys: variantLabelKeys("notionists", "glasses", GLASSES_VARIANTS),
        allowsNone: true,
      },
    ],
  },
  {
    id: "couleurs",
    labelKey: "avatar.groups.colors",
    icon: Palette,
    sections: [
      {
        id: "ink",
        labelKey: "avatar.sections.ink",
        icon: PenLine,
        colorField: "inkColor",
        colors: INK_COLORS,
        colorLabelKey: "avatar.colors.ink",
      },
      {
        id: "paper",
        labelKey: "avatar.sections.paper",
        icon: PaintBucket,
        colorField: "paperColor",
        colors: PAPER_COLORS,
        colorLabelKey: "avatar.colors.paper",
      },
      {
        id: "background",
        labelKey: "avatar.sections.background",
        icon: Palette,
        colorField: "backgroundColor",
        colors: BACKGROUND_COLORS,
        colorLabelKey: "avatar.colors.background",
      },
    ],
  },
]

export const notionistsStyle: AvatarStyleDefinition = {
  id: "notionists",
  labelKey: "avatar.styles.notionists",
  definition: notionistsDefinition as StyleDefinition,
  variantFields: [
    "head",
    "eyes",
    "eyebrows",
    "nose",
    "mouth",
    "hair",
    "beard",
    "clothes",
    "clothesGraphic",
    "gesture",
    "glasses",
  ],
  optionalFields: ["hair", "beard", "clothesGraphic", "gesture", "glasses"],
  colorFields: ["inkColor", "paperColor", "backgroundColor"],
  variants: collectVariants(groups),
  palettes: collectPalettes(groups),
  groups,
  defaults: {
    head: "variant01",
    eyes: "variant01",
    eyebrows: "variant01",
    nose: "variant01",
    mouth: "variant01",
    hair: "variant01",
    beard: "none",
    clothes: "variant01",
    clothesGraphic: "none",
    gesture: "hand",
    glasses: "none",
    inkColor: "#18181b",
    paperColor: "#ffffff",
    backgroundColor: "",
  },
}
