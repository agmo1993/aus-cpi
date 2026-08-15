/**
 * The questions that build a basket.
 *
 * The tree of 87 expenditure classes is the honest interface and stays
 * available, but almost nobody differs from the average household class by
 * class: they differ in a handful of lumpy ways — they rent or they own, they
 * run a car or they do not, there are children in the house or there are not.
 * Each question here is one of those forks, and answering all of them lands on
 * a basket that would have taken forty checkboxes to reach.
 *
 * A question owns a fixed set of expenditure classes (`governs`) and an answer
 * names which of them survive (`keep`). Classes no question governs are never
 * dropped: everyone buys bread, and asking would only add a card. So the
 * selection is the full basket minus what the answers gave away, which is why
 * an unanswered question drops nothing and skipping the form leaves the
 * published basket exactly as the ABS weights it.
 *
 * Items are named as the ABS publishes them and resolved against the loaded
 * pattern, so a retired or renamed class drops out of a question rather than
 * breaking it.
 */

import {
  Baby,
  Beer,
  Bus,
  Car,
  Cat,
  Cigarette,
  CircleSlash,
  Croissant,
  Droplets,
  Flame,
  GraduationCap,
  Home,
  KeyRound,
  Luggage,
  Martini,
  Plane,
  School,
  Salad,
  Sofa,
  UtensilsCrossed,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface BasketOption {
  id: string;
  label: string;
  /** One line under the label, saying what it means for the basket. */
  detail?: string;
  icon?: LucideIcon;
  /** The expenditure classes this answer keeps, out of the question's `governs`. */
  keep: string[];
}

export interface BasketQuestion {
  id: string;
  /** The short label used on the answer summary and the step rail. */
  short: string;
  /** The question itself. */
  title: string;
  /** What answering it does, in one line. */
  help: string;
  /** Several answers can apply at once, and none is a valid answer. */
  multi?: boolean;
  /** Every class the question can drop. */
  governs: string[];
  options: BasketOption[];
}

/** An answer per question, as option ids. A missing key is an unanswered question. */
export type BasketAnswers = Record<string, string[]>;

const OWNER_OCCUPIER = [
  'New dwelling purchase by owner-occupiers',
  'Maintenance and repair of the dwelling',
  'Property rates and charges',
];

const PRIVATE_MOTORING = [
  'Motor vehicles',
  'Automotive fuel',
  'Maintenance and repair of motor vehicles',
  'Spare parts and accessories for motor vehicles',
  'Other services in respect of motor vehicles',
];

const CHILD_CLOTHING = [
  'Garments for infants and children',
  'Footwear for infants and children',
];

export const QUESTIONS: BasketQuestion[] = [
  {
    id: 'housing',
    short: 'Housing',
    title: 'How do you pay for the roof over your head?',
    help: 'The largest single fork in the basket. Rents and the cost of buying and holding a house are separate lines, and no household is in both.',
    governs: ['Rents', ...OWNER_OCCUPIER],
    options: [
      {
        id: 'renting',
        label: 'I rent',
        detail: 'Keeps rents, drops the owner-occupier costs.',
        icon: KeyRound,
        keep: ['Rents'],
      },
      {
        id: 'owner',
        label: 'I own my home',
        detail: 'Keeps new dwelling purchase, maintenance and council rates. The CPI has never priced mortgage interest.',
        icon: Home,
        keep: OWNER_OCCUPIER,
      },
      {
        id: 'neither',
        label: 'Neither — I live rent-free',
        detail: 'Drops both. Everything else in housing still counts.',
        icon: Sofa,
        keep: [],
      },
    ],
  },
  {
    id: 'utilities',
    short: 'Utilities',
    title: 'Which bills arrive in your name?',
    help: 'Electricity is the single most volatile line in the index, and rebates move it several per cent in a quarter. Gas and water are only yours if you are billed for them.',
    multi: true,
    governs: ['Electricity', 'Gas and other household fuels', 'Water and sewerage'],
    options: [
      { id: 'electricity', label: 'Electricity', icon: Zap, keep: ['Electricity'] },
      {
        id: 'gas',
        label: 'Gas or other fuels',
        icon: Flame,
        keep: ['Gas and other household fuels'],
      },
      {
        id: 'water',
        label: 'Water and sewerage',
        icon: Droplets,
        keep: ['Water and sewerage'],
      },
    ],
  },
  {
    id: 'transport',
    short: 'Transport',
    title: 'How do you get around?',
    help: 'Running a car is five separate lines — the car, the fuel, the servicing, the parts and the registration — against one for public transport.',
    multi: true,
    governs: [...PRIVATE_MOTORING, 'Urban transport fares'],
    options: [
      {
        id: 'car',
        label: 'I drive',
        detail: 'Fuel, servicing, registration and the car itself.',
        icon: Car,
        keep: PRIVATE_MOTORING,
      },
      {
        id: 'transit',
        label: 'Buses, trains and trams',
        detail: 'Urban transport fares.',
        icon: Bus,
        keep: ['Urban transport fares'],
      },
    ],
  },
  {
    id: 'household',
    short: 'Household',
    title: 'Who else is in the household?',
    help: 'Child care and school fees are among the fastest-moving lines in the index, and they apply to a minority of households. Leave it blank if none of them apply.',
    multi: true,
    governs: [
      'Child care',
      'Preschool and primary education',
      'Secondary education',
      'Tertiary education',
      ...CHILD_CLOTHING,
    ],
    options: [
      {
        id: 'under-school',
        label: 'Children not yet at school',
        detail: 'Child care, and clothing for infants and children.',
        icon: Baby,
        keep: ['Child care', ...CHILD_CLOTHING],
      },
      {
        id: 'school',
        label: 'Children at school',
        detail: 'Preschool, primary and secondary fees, and their clothes.',
        icon: School,
        keep: ['Preschool and primary education', 'Secondary education', ...CHILD_CLOTHING],
      },
      {
        id: 'tertiary',
        label: 'Someone studying',
        detail: 'University and TAFE fees.',
        icon: GraduationCap,
        keep: ['Tertiary education'],
      },
    ],
  },
  {
    id: 'eating',
    short: 'Eating out',
    title: 'How often do meals come from somewhere else?',
    help: 'Restaurant meals and takeaway are 7.7% of the published basket between them, and they have run well ahead of groceries since the pandemic.',
    governs: ['Restaurant meals', 'Take away and fast foods'],
    options: [
      {
        id: 'both',
        label: 'Restaurants and takeaway',
        detail: 'Keeps both lines at their published weight.',
        icon: UtensilsCrossed,
        keep: ['Restaurant meals', 'Take away and fast foods'],
      },
      {
        id: 'takeaway',
        label: 'Mostly takeaway',
        detail: 'Drops restaurant meals.',
        icon: Croissant,
        keep: ['Take away and fast foods'],
      },
      {
        id: 'home',
        label: 'I cook at home',
        detail: 'Drops both, and the groceries left behind carry more of the basket.',
        icon: Salad,
        keep: [],
      },
    ],
  },
  {
    id: 'vices',
    short: 'Alcohol',
    title: 'Do you drink or smoke?',
    help: 'Tobacco is 1.6% of the basket and has risen faster than anything else in it, on excise alone. Not smoking is the single largest thing most people can strike out.',
    multi: true,
    governs: ['Beer', 'Wine', 'Spirits', 'Tobacco'],
    options: [
      { id: 'beer', label: 'Beer', icon: Beer, keep: ['Beer'] },
      { id: 'wine', label: 'Wine', icon: Wine, keep: ['Wine'] },
      { id: 'spirits', label: 'Spirits', icon: Martini, keep: ['Spirits'] },
      { id: 'tobacco', label: 'Tobacco', icon: Cigarette, keep: ['Tobacco'] },
    ],
  },
  {
    id: 'travel',
    short: 'Travel',
    title: 'Do you take holidays away from home?',
    help: 'Nearly 7% of the basket is holiday travel, split between domestic and international, and airfares are the noisiest series the ABS publishes.',
    multi: true,
    governs: [
      'Domestic holiday travel and accommodation',
      'International holiday travel and accommodation',
    ],
    options: [
      {
        id: 'domestic',
        label: 'Within Australia',
        icon: Luggage,
        keep: ['Domestic holiday travel and accommodation'],
      },
      {
        id: 'international',
        label: 'Overseas',
        icon: Plane,
        keep: ['International holiday travel and accommodation'],
      },
    ],
  },
  {
    id: 'pets',
    short: 'Pets',
    title: 'Is there a pet in the house?',
    help: 'Pet food and vet bills are two small lines, and vet fees have outrun the headline every year since the weights were rebased.',
    governs: ['Pets and related products', 'Veterinary and other services for pets'],
    options: [
      {
        id: 'yes',
        label: 'Yes',
        icon: Cat,
        keep: ['Pets and related products', 'Veterinary and other services for pets'],
      },
      { id: 'no', label: 'No', icon: CircleSlash, keep: [] },
    ],
  },
];

/**
 * Where the form starts: the average household, near enough.
 *
 * The defaults are the majority answer to each question rather than the full
 * basket, so the first card is already a plausible basket and the reader is
 * correcting it rather than building one from nothing. The two questions with
 * no majority answer — children, and what you drink — start blank and empty.
 */
export const DEFAULT_ANSWERS: BasketAnswers = {
  housing: ['owner'],
  utilities: ['electricity', 'gas', 'water'],
  transport: ['car', 'transit'],
  household: [],
  eating: ['both'],
  vices: ['beer', 'wine', 'spirits'],
  travel: ['domestic', 'international'],
  pets: ['no'],
};

/** Every class governed by some question, i.e. everything the form can drop. */
export const GOVERNED = new Set(QUESTIONS.flatMap((question) => question.governs));

/** The classes an answer keeps, unioned over the options it picked. */
export function keptBy(question: BasketQuestion, picked: string[]): Set<string> {
  return new Set(
    picked.flatMap((id) => question.options.find((option) => option.id === id)?.keep ?? [])
  );
}

/**
 * The expenditure classes a set of answers selects.
 *
 * Resolved against the loaded pattern's leaves, so a class named in a question
 * but missing from the pattern simply never appears.
 */
export function selectionFromAnswers(answers: BasketAnswers, leaves: string[]): string[] {
  const dropped = new Set<string>();

  for (const question of QUESTIONS) {
    const picked = answers[question.id];
    if (!picked) continue;

    const kept = keptBy(question, picked);
    for (const item of question.governs) {
      if (!kept.has(item)) dropped.add(item);
    }
  }

  return leaves.filter((leaf) => !dropped.has(leaf));
}

/**
 * The answers that most nearly produce a selection, for the form's controls
 * after the reader has edited the tree by hand.
 *
 * An option counts as picked when everything it keeps is still selected, which
 * is exact for a selection the form itself produced and a reasonable reading of
 * one it did not. It cannot be exact in general — the tree can drop half of
 * private motoring, and no answer says that — so the form is only ever
 * re-derived for display, never written back over a manual selection.
 */
export function answersFromSelection(selected: Set<string>): BasketAnswers {
  const answers: BasketAnswers = {};

  for (const question of QUESTIONS) {
    const relevant = question.options.filter((option) =>
      option.keep.every((item) => selected.has(item))
    );

    // A single-answer question takes the most specific match: 'neither' keeps
    // nothing and so matches every selection, but it is only the right answer
    // when no option with items in it matches.
    answers[question.id] = question.multi
      ? relevant.filter((option) => option.keep.length > 0).map((option) => option.id)
      : relevant
          .sort((a, b) => b.keep.length - a.keep.length)
          .slice(0, 1)
          .map((option) => option.id);
  }

  return answers;
}
