import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  'Notre histoire — Comment SferaLuna est née',
  "L'histoire de SferaLuna : pourquoi nous avons créé un site de rencontres premium pensé exclusivement pour les femmes françaises.",
  '/histoire'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
