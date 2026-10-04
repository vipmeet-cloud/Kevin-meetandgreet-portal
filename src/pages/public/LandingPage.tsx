import { useSettings } from '../../context/SettingsContext';
import { HeroSkeleton } from '../../components/common/LoadingSkeleton';
import { HeroSection } from '../../components/landing/HeroSection';
import { AboutSection } from '../../components/landing/AboutSection';
import { ExperienceSection } from '../../components/landing/ExperienceSection';
import { ProcessSection } from '../../components/landing/ProcessSection';
import { ImportantInfoSection } from '../../components/landing/ImportantInfoSection';
import { FaqSection } from '../../components/landing/FaqSection';
import { ContactSection } from '../../components/landing/ContactSection';

export function LandingPage() {
  const { settings, isLoading } = useSettings();

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <HeroSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fadeIn">
      <HeroSection settings={settings} />
      <ExperienceSection settings={settings || ({} as any)} />
      <ProcessSection />
      <AboutSection settings={settings || ({} as any)} />
      <ImportantInfoSection />
      <FaqSection />
      <ContactSection settings={settings || ({} as any)} />
    </div>
  );
}
