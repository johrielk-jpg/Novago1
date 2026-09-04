export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-2.5 [&_p]:text-[13px] [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-[13px]">
      <p className="safety-note">
        Document de travail. Ces textes couvrent les points attendus pour une plateforme de mise en
        relation, mais doivent être relus et complétés par un juriste avant toute mise en ligne
        réelle — notamment sur la qualification hébergeur / éditeur (section 5 du brief).
      </p>
      {children}
      <div className="h-10" />
    </div>
  );
}
