import type { ProfileCard } from '@/lib/types';

/**
 * Jeu de données fictif — sert uniquement quand aucun projet Supabase n'est
 * configuré (mode démo local) et pour la vitrine publique anonymisée de la
 * page d'accueil. Aucun profil réel n'est exposé sans compte (section 5).
 */

export type DemoProfile = ProfileCard & { gradient: string; interests: string[] };

function make(
  id: string,
  first_name: string,
  age: number,
  city: string,
  distanceKm: number,
  gradient: string,
  bio: string,
  interests: string[],
  extra: Partial<DemoProfile> = {},
): DemoProfile {
  return {
    id,
    user_id: `demo-${id}`,
    first_name,
    age,
    city,
    lat: null,
    lng: null,
    height_cm: 165 + ((age * 7) % 14),
    nationality: null,
    languages: ['Français', 'Anglais'],
    bio,
    visibility: 'visible',
    created_at: new Date(Date.now() - Number(id.replace(/\D/g, '')) * 86_400_000).toISOString(),
    verification_status: 'verifie',
    role: 'femme',
    online: false,
    acceptance_rate: null,
    photoUrl: null,
    distanceKm,
    isFavorite: false,
    interests,
    gradient,
    ...extra,
  };
}

export const demoProfiles: DemoProfile[] = [
  make('1', 'Camille', 29, 'Paris 11e', 3.4, 'linear-gradient(150deg,#7C2340,#B8935B)',
    'Architecte d’intérieur le jour, équipière de voile le week-end. Je cherche quelqu’un avec qui parler d’un bon film autant que d’un mauvais plat raté ensemble.',
    ['Voyage', 'Voile', 'Cuisine', 'Art & expositions'], { online: true }),
  make('2', 'Léa', 27, 'Boulogne-Billancourt', 6.1, 'linear-gradient(150deg,#4C6B54,#B8935B)',
    'Kinésithérapeute passionnée de trail et de séries scandinaves. À la recherche de conversations qui durent plus qu’un match.',
    ['Sport', 'Séries', 'Nature & randonnée'], { online: true }),
  make('3', 'Manon', 28, 'Paris 20e', 4.7, 'linear-gradient(150deg,#B8935B,#221B22)',
    'Illustratrice freelance. Grande lectrice, petite dormeuse. Toujours partante pour une expo.',
    ['Lecture', 'Art & expositions', 'Photographie'], { online: true }),
  make('4', 'Julie', 30, 'Montreuil', 7.2, 'linear-gradient(150deg,#7C2340,#4C6B54)',
    'Prof de lettres. Je collectionne les librairies de quartier et les mauvais jeux de mots.',
    ['Lecture', 'Cinéma', 'Danse'], { online: true }),
  make('5', 'Sarah', 31, 'Paris 4e', 1.8, 'linear-gradient(150deg,#221B22,#7C2340)',
    'Cheffe de projet dans l’événementiel. Amatrice de cinéma d’auteur et de brunchs interminables.',
    ['Cinéma', 'Gastronomie', 'Voyage']),
  make('6', 'Emma', 26, 'Paris 3e', 2.3, 'linear-gradient(150deg,#B8935B,#7C2340)',
    'Vétérinaire. Deux chats, un vélo, zéro patience pour les conversations creuses.',
    ['Nature & randonnée', 'Bénévolat', 'Musique']),
  make('7', 'Pauline', 33, 'Paris 11e', 2.9, 'linear-gradient(150deg,#4C6B54,#221B22)',
    'Avocate en droit social. Je cuisine mal mais avec conviction.',
    ['Cuisine', 'Voyage', 'Jeux de société']),
  make('8', 'Nina', 28, 'Paris 12e', 3.5, 'linear-gradient(150deg,#7C2340,#B8935B)',
    'Développeuse. Grimpe le samedi, dort le dimanche.',
    ['Sport', 'Musique', 'Séries']),
  make('9', 'Alice', 29, 'Paris 6e', 5.0, 'linear-gradient(150deg,#B8935B,#4C6B54)',
    'Libraire. Je crois encore aux longues lettres et aux dimanches sans écran.',
    ['Lecture', 'Cinéma', 'Art & expositions'], { acceptance_rate: 98 }),
  make('10', 'Olivia', 31, 'Paris 17e', 8.4, 'linear-gradient(150deg,#221B22,#B8935B)',
    'Sage-femme. Horaires improbables, humour solide.',
    ['Danse', 'Gastronomie', 'Voyage'], { acceptance_rate: 96 }),
  make('11', 'Romane', 27, 'Vincennes', 8.9, 'linear-gradient(150deg,#7C2340,#221B22)',
    'Journaliste indépendante. Curieuse de tout, sceptique par métier.',
    ['Photographie', 'Voyage', 'Cinéma'], { acceptance_rate: 95 }),
  make('12', 'Valentine', 25, 'Paris 10e', 4.1, 'linear-gradient(150deg,#4C6B54,#7C2340)',
    'Étudiante en architecture, dernière année. Terrasses et carnets de croquis.',
    ['Art & expositions', 'Musique', 'Photographie']),
  make('13', 'Hélène', 32, 'Ivry-sur-Seine', 9.6, 'linear-gradient(150deg,#B8935B,#221B22)',
    'Ingénieure agronome. Potager sur le balcon, projets un peu plus grands en tête.',
    ['Nature & randonnée', 'Cuisine', 'Bénévolat']),
  make('14', 'Diane', 28, 'Paris 19e', 6.0, 'linear-gradient(150deg,#7C2340,#4C6B54)',
    'Kiné du sport. Je marche vite, je parle plus vite.',
    ['Sport', 'Séries', 'Jeux de société']),
];

export function demoById(id: string): DemoProfile | null {
  return demoProfiles.find((p) => p.id === id) ?? null;
}

/** Dégradé stable dérivé d'un identifiant, pour les profils sans photo. */
export function gradientFor(seed: string): string {
  const palette = [
    'linear-gradient(150deg,#7C2340,#B8935B)',
    'linear-gradient(150deg,#4C6B54,#B8935B)',
    'linear-gradient(150deg,#B8935B,#221B22)',
    'linear-gradient(150deg,#7C2340,#4C6B54)',
    'linear-gradient(150deg,#221B22,#7C2340)',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return palette[hash % palette.length];
}
